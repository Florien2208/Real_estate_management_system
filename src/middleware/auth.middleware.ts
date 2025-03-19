import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import asyncHandler from "express-async-handler";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { IUserDocument } from "@/models";
import User from "@/models/user.model";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

// Protect routes
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      // Check if token exists in cookies
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return next(
        createError(
          StatusCodes.UNAUTHORIZED,
          "Not authorized to access this route"
        )
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload;

      // Get user from token
      const user = await User.findById(decoded.id);

      // Check if user exists
      if (!user) {
        return next(
          createError(StatusCodes.UNAUTHORIZED, "User no longer exists")
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return next(
          createError(StatusCodes.FORBIDDEN, "User account is deactivated")
        );
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return next(
        createError(
          StatusCodes.UNAUTHORIZED,
          "Not authorized to access this route"
        )
      );
    }
  }
);

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        createError(
          StatusCodes.UNAUTHORIZED,
          "Not authorized to access this route"
        )
      );
    }

    // Check if user role is in the authorized roles or if user is accessing their own resource
    const isOwner =
      roles.includes("owner") &&
      req.params.id &&
      req.params.id === req.user._id.toString();

    if (!roles.includes(req.user.role) && !isOwner) {
      return next(
        createError(
          StatusCodes.FORBIDDEN,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }

    next();
  };
};
