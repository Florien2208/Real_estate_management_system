import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";

import { uploadMultipleMiddleware } from "@/middleware/upload.middleware";
import { protect } from "@/middleware/auth.middleware";


const propertyRouter = express.Router();

// Protected routes - require authentication
propertyRouter.post("/", protect, createProperty);
propertyRouter.get("/", getAllProperties);
propertyRouter.get("/:id", getPropertyById);
propertyRouter.put("/:id", protect, updateProperty);
propertyRouter.delete("/:id", protect, deleteProperty);

// Add a route for uploading property images
propertyRouter.post(
  "/:id/images",
  protect,
  uploadMultipleMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const property = await import("../models/property.model")
        .then((m) => m.default)
        .then((m) => m.findById(id));

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const imageUrls = (req.files as Express.Multer.File[]).map(
        (file) => (file as any).path
      );

      // Add new images to the existing images array
      property.images = [...property.images, ...imageUrls];
      await property.save();

      res.status(200).json({
        message: "Images uploaded successfully",
        images: property.images,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({
        message: "Failed to upload images",
        error: (error as Error).message,
      });
    }
  }
);

export default propertyRouter;
