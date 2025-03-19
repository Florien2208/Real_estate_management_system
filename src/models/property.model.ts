import mongoose, { Schema, Document } from "mongoose";

export interface IProperty extends Document {
  propertyTitle: string;
  price: number;
  location: string;
  propertyType: "House" | "Apartment" | "Commercial" | "Land" | "Other";
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[]; // Array of Cloudinary URLs
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema(
  {
    propertyTitle: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    location: { type: String, required: true },
    propertyType: {
      type: String,
      required: true,
      enum: ["House", "Apartment", "Commercial", "Land", "Other"],
      default: "House",
    },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    images: [{ type: String }], // Array of Cloudinary URLs
    description: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Property = mongoose.model<IProperty>("Property", PropertySchema);
export default Property;
