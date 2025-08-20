import User from "../models/User.js";
import Consultant from "../models/Consultant.js";
import Verification from "../models/Verification.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import path from "path";
import { CONSULTANT_STATUS } from "../config/constants.js";

import { ADMIN_CREDENTIALS, SUB_ADMIN_CREDENTIALS } from "../config/admin.js";

// @desc    Initialize admin and sub-admin accounts
const initializeAdminAccounts = async () => {
  try {
    // Check and create admin
    const adminExists = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    if (!adminExists) {
      await User.create(ADMIN_CREDENTIALS);
    }

    // Check and create sub-admin
    const subAdminExists = await User.findOne({
      email: SUB_ADMIN_CREDENTIALS.email,
    });
    if (!subAdminExists) {
      await User.create(SUB_ADMIN_CREDENTIALS);
    }
  } catch (error) {
    console.error("Error initializing admin accounts:", error);
  }
};

// Initialize admin accounts when the server starts
initializeAdminAccounts();

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Prevent registration with admin/sub-admin role
    if (role === "admin" || role === "sub-admin") {
      return res
        .status(403)
        .json({ message: "Cannot register with this role" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    // Auto-verify users since we're not sending emails
    user.isVerified = true;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// This login implementation has been moved below

// @desc    Update user credentials
// @route   PUT /api/auth/update-credentials
export const updateCredentials = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, newUsername } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update username if provided
    if (newUsername) {
      user.name = newUsername;
    }

    // Update password if provided
    if (newPassword) {
      // Password validation
      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: "Credentials updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register as consultant
// @route   POST /api/auth/register/consultant
export const registerConsultant = async (req, res, next) => {
  try {
    // Step 1: Create user account
    const { name, email, password, contactNumber, location, linkedInProfile } =
      req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "consultant",
      contactNumber,
      location,
      linkedInProfile,
      isVerified: true, // Auto-verify
    });

    // Upload profile photo if exists (local storage)
    if (req.files?.profilePhoto) {
      user.profilePhoto = {
        url: `/uploads/${req.files.profilePhoto[0].filename}`,
      };
      await user.save();
    }

    // Step 2: Create consultant profile
    const consultantData = {
      user: user._id,
      name,
      email,
      role: user.role,
      contactNumber,
      location,
      linkedInProfile,
      designation: req.body.designation,
      company: req.body.company,
      industry: req.body.industry,
      skills: req.body.skills.split(",").map((skill) => skill.trim()),
      yearsOfExperience: req.body.yearsOfExperience,
      about: req.body.about,
      languages: req.body.languages.split(",").map((lang) => lang.trim()),
      expectedFee: req.body.expectedFee,
    };

    // Upload resume if exists (local storage)
    if (req.files?.resume) {
      consultantData.resume = {
        url: `/uploads/${req.files.resume[0].filename}`,
      };
    }

    const consultant = await Consultant.create(consultantData);

    // Step 3: Process certifications (local storage)
    const certifications = [];
    if (req.files?.certifications) {
      for (let i = 0; i < req.files.certifications.length; i++) {
        const file = req.files.certifications[i];

        // Get certification name from body
        const certName =
          req.body.certifications?.[i]?.name || file.originalname;

        certifications.push({
          name: certName,
          url: `/uploads/${file.filename}`,
        });
      }
    }

    // Create verification record
    const verification = await Verification.create({
      consultant: user._id,
      documents: certifications,
      status: CONSULTANT_STATUS.PENDING,
    });

    // Associate verification with consultant
    consultant.verification = verification._id;
    await consultant.save();

    res.status(201).json({
      message: "Consultant registration successful",
      userId: user._id,
      consultantId: consultant._id, // Return consultant ID
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Validate password
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Consultant login case
    if (user.role === "consultant") {
      const consultant = await Consultant.findOne({ user: user._id });

      if (!consultant) {
        return res
          .status(404)
          .json({ message: "Consultant profile not found" });
      }

      if (consultant.status !== "approved") {
        return res
          .status(403)
          .json({ message: "Your consultant profile is under review" });
      }

      // Respond with consultant profile details
      return res.json({
        _id: consultant._id,
        name: consultant.name,
        email: consultant.email,
        role: user.role,
        token: generateToken(user._id), // token tied to user
        profilePhoto: consultant.profilePhoto?.url,
      });
    }

    // Normal user login case
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      profilePhoto: user.profilePhoto?.url,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email (no longer needed with auto-verify)
// @route   GET /api/auth/verify/:token
export const verifyEmail = async (req, res, next) => {
  res.status(200).json({ message: "Email verification is no longer required" });
};

// @desc    Forgot password (simplified)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  res
    .status(200)
    .json({ message: "Please contact support for password reset" });
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
