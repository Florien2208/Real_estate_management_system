import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { FilterQuery } from "mongoose";
import createError from "http-errors";
import {
  comparePassword,
  validatePasswordComplexity,
} from "@/utils/password.utils";
import User, { IUserDocument } from "@/models/user.model";

// @desc    Create a new user
// @route   POST /api/users
// @access  Admin
export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email,phone, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(
        createError(
          StatusCodes.BAD_REQUEST,
          "User already exists with this email"
        )
      );
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || "user",
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Admin
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  // Parse query parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

  // Build filter query
  const filterQuery: FilterQuery<IUserDocument> = {};

  if (req.query.firstName) {
    filterQuery.firstName = { $regex: req.query.firstName, $options: "i" };
  }

  if (req.query.lastName) {
    filterQuery.lastName = { $regex: req.query.lastName, $options: "i" };
  }

  if (req.query.email) {
    filterQuery.email = { $regex: req.query.email, $options: "i" };
  }

  if (req.query.role) {
    filterQuery.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    filterQuery.isActive = req.query.isActive === "true";
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(filterQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filterQuery),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(StatusCodes.OK).json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin or Owner
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin or Owner
export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, role, isActive } = req.body;

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return next(
          createError(StatusCodes.BAD_REQUEST, "Email already in use")
        );
      }
    }

    // Update user fields
    user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        role,
        isActive,
      },
      { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    await user.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {},
      message: "User successfully deleted",
    });
  }
);

export const updatePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Validate password complexity
    const { isValid, message } = validatePasswordComplexity(newPassword);
    if (!isValid) {
      return next(createError(StatusCodes.BAD_REQUEST, { message: message }));
    }

    // For admin, current password is not required
    // For owner, validate current password
    if (req.user?.role !== "admin") {
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return next(
          createError(StatusCodes.UNAUTHORIZED, "Current password is incorrect")
        );
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);
// @desc    Update user's last login
// @route   PUT /api/users/:id/last-login
// @access  Private
export const updateLastLogin = asyncHandler(
  async (req: Request, res: Response) => {
    await User.findByIdAndUpdate(req.params.id, {
      lastLogin: new Date(),
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Last login updated",
    });
  }
);
