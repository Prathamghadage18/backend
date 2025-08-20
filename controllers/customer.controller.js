import e from "express";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

// Create consultation request
export const createCustomer = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      country,
      countryCode,
      email,
      password,
      phone,
      linkedInProfile,
      companyName,
      companyDetails,
      serviceArea,
      requirements,
      urgentRequest,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = await User.create({
      name: firstName,
      email,
      password,
      role: "user",
      contactNumber: phone,
      location: country,
      linkedInProfile,
    });

    // Process file uploads (local storage)
    const files = [];
    if (req.files?.supportDocs) {
      for (const file of req.files.supportDocs) {
        files.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
        });
      }
    }

    const request = await Customer.create({
      user,
      firstName,
      lastName,
      country,
      countryCode,
      email,
      password,
      phone,
      linkedInProfile,
      companyName,
      companyDetails,
      serviceArea,
      requirements,
      urgentRequest: urgentRequest || false,
      files,
    });

    res.status(201).json({
      success: true,
      message: "Customer profile submitted successfully",
      data: {
        requestId: request._id,
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().populate("user", "name email");
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}