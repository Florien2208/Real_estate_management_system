import { logger } from "@/utils/logger.utils";
import { Request, Response, NextFunction } from "express";

import { StatusCodes } from "http-status-codes";
// Error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
 logger.error(` Error: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
};


