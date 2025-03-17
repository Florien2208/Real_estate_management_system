import { getUserById, createUser, getUsers } from "@/controllers";
import { Router } from "express";


const userRoutes = Router();

userRoutes.post("/", createUser);
userRoutes.get("/", getUsers);
userRoutes.get("/:id", getUserById);

export default userRoutes;
