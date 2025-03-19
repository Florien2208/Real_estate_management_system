import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Generate JWT token for authentication
 * @param userId - User ID to include in the token
 * @returns JWT token string
 */
export const generateToken = (userId: mongoose.Types.ObjectId): string => {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Use a number (in seconds) for expiresIn
  const expiresIn: number = process.env.JWT_EXPIRE
    ? parseInt(process.env.JWT_EXPIRE, 10)
    : 30 * 24 * 60 * 60; // 30 days in seconds

  const options: jwt.SignOptions = { expiresIn };

  return jwt.sign({ id: userId.toString() }, secret, options);
};

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.verify(token, secret) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
};
