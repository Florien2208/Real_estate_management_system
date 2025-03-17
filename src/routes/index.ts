import { Router } from "express";
import userRoutes from "./user.routes";

const appRoutes = Router();

appRoutes.use("/user", userRoutes);

export default appRoutes;
