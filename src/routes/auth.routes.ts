import express from "express";
import {
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  blockUser,
  unblockUser,
} from "@/controllers/auth.controller";
import { protect, authorize } from "@/middleware/auth.middleware";

const authRouter = express.Router();

// Public routes
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.put("/reset-password/:resetToken", resetPassword);

// Protected routes
authRouter.use(protect); // All routes below this line require authentication
authRouter.get("/logout", logout);
authRouter.get("/me", getMe);
authRouter.put("/change-password", changePassword);

// Admin only routes
authRouter.put("/block/:id", authorize("admin"), blockUser);
authRouter.put("/unblock/:id", authorize("admin"), unblockUser);

export default authRouter;
