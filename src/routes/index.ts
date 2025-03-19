import { Router } from "express";
import userRoutes from "./user.routes";
import authRouter from "./auth.routes";

const appRoutes = Router();

appRoutes.use("/users", userRoutes);
appRoutes.use("/auth", authRouter);

export default appRoutes;
