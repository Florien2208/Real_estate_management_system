// Controller: src/controllers/contact.controller.ts
import ContactUs from "@/models/contactus.model";
import { validateContactInput } from "@/utils/validator.utils";
import { Request, Response } from "express";


export const createContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullname, email, subject, phone, message } = req.body;

    // Validate input
    const validationError = validateContactInput(req.body);
    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    // Create new contact
    const contact = new ContactUs({
      fullname,
      email,
      subject,
      phone,
      message,
    });

    const savedContact = await contact.save();

    res.status(201).json({
      success: true,
      message: "Contact message received successfully",
      data: savedContact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to process contact form submission",
      error: error.message,
    });
  }
};

export const getAllContacts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contacts = await ContactUs.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};

export const getContactById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contact = await ContactUs.findById(req.params.id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Contact not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
      error: error.message,
    });
  }
};

export const deleteContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contact = await ContactUs.findByIdAndDelete(req.params.id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Contact not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message,
    });
  }
};
