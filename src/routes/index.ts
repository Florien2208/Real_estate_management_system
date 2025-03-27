import { Router } from "express";
import userRoutes from "./user.routes";
import authRouter from "./auth.routes";
import contactRouter from "./contactus.routes";
import propertyRouter from "./propety.routes";
import {
  uploadMiddleware,
  uploadMultipleMiddleware,
} from "@/middleware/upload.middleware";

const appRoutes = Router();

appRoutes.use("/users", userRoutes);
appRoutes.use("/auth", authRouter);
appRoutes.use("/contact-us", contactRouter);
appRoutes.use("/property", propertyRouter);
appRoutes.post("/api/upload", uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Return the Cloudinary URL
  return res.status(200).json({
    imageUrl: (req.file as any).path,
  });
});

appRoutes.post("/api/upload-multiple", uploadMultipleMiddleware, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  // Return array of Cloudinary URLs
  const imageUrls = (req.files as Express.Multer.File[]).map(
    (file) => (file as any).path
  );
  return res.status(200).json({ imageUrls });
});

export default appRoutes;
