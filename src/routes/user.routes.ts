import express from "express";
import {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updatePassword,
  updateLastLogin,
  getUsers,
} from "@/controllers";
import { protect, authorize } from "@/middleware/auth.middleware";

const userRoutes = express.Router();

// Public routes
userRoutes.post("/", createUser);

// Protected routes
userRoutes.use(protect);

// Admin routes
userRoutes.route("/").get(authorize("user"), getUsers);

// Admin or owner routes
userRoutes
  .route("/:id")
  .get(authorize("admin", "owner"), getUserById)
  .put(authorize("admin", "owner"), updateUser)
  .delete(authorize("admin"), deleteUser);

userRoutes.put("/:id/password", authorize("admin", "owner"), updatePassword);
userRoutes.put("/:id/last-login", updateLastLogin);

export default userRoutes;
