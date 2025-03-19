import { Request, Response } from "express";
import Property, { IProperty } from "../models/property.model";
import mongoose from "mongoose";
import cloudinary from "@/config/cloudinary.config";


export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      propertyTitle,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      images,
      description,
    } = req.body;

    // Assuming user ID is stored in req.user after authentication
    const createdBy = req.user?.id;

    if (!createdBy) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const newProperty = new Property({
      propertyTitle,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      images: images || [],
      description,
      createdBy,
    });

    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    console.error("Error creating property:", error);
    res
      .status(500)
      .json({
        message: "Failed to create property",
        error: (error as Error).message,
      });
  }
};
export const getAllProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = 10, page = 1, createdBy, propertyType } = req.query;

    const filter: any = {};
    if (createdBy) filter.createdBy = createdBy;
    if (propertyType) filter.propertyType = propertyType;

    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Property.find(filter)
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      properties,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch properties",
        error: (error as Error).message,
      });
  }
};

export const getPropertyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid property ID format" });
      return;
    }

    const property = await Property.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch property",
        error: (error as Error).message,
      });
  }
};
export const updateProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid property ID format" });
      return;
    }

    // Check if user owns this property (or is admin)
    const property = await Property.findById(id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (
      property.createdBy.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      res
        .status(403)
        .json({ message: "Not authorized to update this property" });
      return;
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);
    res
      .status(500)
      .json({
        message: "Failed to update property",
        error: (error as Error).message,
      });
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid property ID format" });
      return;
    }

    // Check if user owns this property (or is admin)
    const property = await Property.findById(id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (
      property.createdBy.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this property" });
      return;
    }

    // Delete images from Cloudinary before deleting the property
    for (const imageUrl of property.images) {
      // Extract public_id from Cloudinary URL
      const publicId = imageUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`property-images/${publicId}`);
      }
    }

    await Property.findByIdAndDelete(id);

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res
      .status(500)
      .json({
        message: "Failed to delete property",
        error: (error as Error).message,
      });
  }
};
