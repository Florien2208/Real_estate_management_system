// Routes: src/routes/contact.routes.ts
import express from "express";


import {
  getContactById,
  createContact,
  getAllContacts,
  deleteContact,
} from "@/controllers";
import { protect } from "@/middleware/auth.middleware";

const contactRouter = express.Router();

// Public route for submitting contact form
contactRouter.post("/", createContact);

// Protected routes - only accessible by authenticated users (like admins)
contactRouter.get("/", protect, getAllContacts);
contactRouter.get("/:id", protect, getContactById);
contactRouter.delete("/:id", protect, deleteContact);

export default contactRouter;
