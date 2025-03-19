import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import crypto from "crypto";
import User from "@/models/user.model";
import { generateToken } from "@/utils/token.utils";
import { sendEmail } from "@/utils/email.utils";


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Validate email and password are provided
    if (!email || !password) {
      return next(
        createError(
          StatusCodes.BAD_REQUEST,
          "Please provide email and password"
        )
      );
    }

    // Check if user exists and include password in the result
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists
    if (!user) {
      return next(createError(StatusCodes.UNAUTHORIZED, "Invalid credentials"));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        createError(
          StatusCodes.FORBIDDEN,
          "Your account has been deactivated. Please contact an administrator."
        )
      );
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(StatusCodes.UNAUTHORIZED, "Invalid credentials"));
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          parseInt(process.env.JWT_COOKIE_EXPIRE || "30") * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Send response
    res.status(StatusCodes.OK).cookie("token", token, cookieOptions).json({
      success: true,
      token,
      data: user,
    });
  }
);

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User logged out successfully",
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  res.status(StatusCodes.OK).json({
    success: true,
    data: user,
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire (10 minutes)
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with token and expiry
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpire,
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Create message
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email sent",
      });
    } catch (error) {
      // Reset fields if email fails
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      });

      return next(
        createError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Email could not be sent"
        )
      );
    }
  }
);

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return next(
        createError(StatusCodes.BAD_REQUEST, "Invalid or expired token")
      );
    }

    // Set new password
    user.password = req.body.password;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Save user with new password
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    // Send response
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset successful",
      token,
    });
  }
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(
        createError(StatusCodes.UNAUTHORIZED, "Current password is incorrect")
      );
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated successfully",
      token,
    });
  }
);

// @desc    Block user
// @route   PUT /api/auth/block/:id
// @access  Admin only
export const blockUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;

    // Find user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Cannot block yourself or another admin
    if (user._id.toString() === req.user?._id.toString()) {
      return next(
        createError(StatusCodes.BAD_REQUEST, "You cannot block yourself")
      );
    }

    if (user.role === "admin" && req.user?.role !== "admin") {
      return next(
        createError(StatusCodes.FORBIDDEN, "You cannot block an admin user")
      );
    }

    // Update user to inactive
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    // Optionally, send email notification to user
    try {
      await sendEmail({
        email: user.email,
        subject: "Account Deactivated",
        message: `Your account has been deactivated. Reason: ${
          reason || "No reason provided"
        }. Please contact support for more information.`,
      });
    } catch (error) {
      console.error("Error sending block notification email", error);
      // Continue processing even if email fails
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "User has been blocked successfully",
    });
  }
);

// @desc    Unblock user
// @route   PUT /api/auth/unblock/:id
// @access  Admin only
export const unblockUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Find user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }

    // Update user to active
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    // Optionally, send email notification to user
    try {
      await sendEmail({
        email: user.email,
        subject: "Account Reactivated",
        message:
          "Your account has been reactivated. You can now log in to your account.",
      });
    } catch (error) {
      console.error("Error sending unblock notification email", error);
      // Continue processing even if email fails
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "User has been unblocked successfully",
    });
  }
);
