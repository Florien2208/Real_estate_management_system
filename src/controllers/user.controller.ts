
import { IUser } from "@/models";
import User from "@/models/user.model";
import { logger } from "@/utils/logger.utils";
import { Request, Response } from "express";


export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userData: IUser = req.body;
    const newUser = await User.create(userData);

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error: any) {
    logger.error(`Error creating user: ${error.message}`);

    // Handle duplicate email error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: "Email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    logger.error(`Error getting users: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error(`Error getting user: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
