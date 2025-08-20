import Consultant from "../models/Consultant.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { notFoundError } from "../utils/helpers.js";

// @desc    Update consultant profile
// @route   PUT /api/consultants/profile
export const updateConsultantProfile = async (req, res, next) => {
  try {
    const consultant = await Consultant.findOne({ user: req.user._id })
      .populate("user")
      .populate("verification");

    if (!consultant) {
      return notFoundError("Consultant profile not found", res);
    }

    // Update user fields
    if (req.body.name) consultant.user.name = req.body.name;
    if (req.body.contactNumber)
      consultant.user.contactNumber = req.body.contactNumber;
    if (req.body.location) consultant.user.location = req.body.location;
    if (req.body.linkedInProfile)
      consultant.user.linkedInProfile = req.body.linkedInProfile;

    // Update consultant fields
    if (req.body.designation) consultant.designation = req.body.designation;
    if (req.body.company) consultant.company = req.body.company;
    if (req.body.industry) consultant.industry = req.body.industry;
    if (req.body.skills)
      consultant.skills = req.body.skills
        .split(",")
        .map((skill) => skill.trim());
    if (req.body.yearsOfExperience)
      consultant.yearsOfExperience = req.body.yearsOfExperience;
    if (req.body.about) consultant.about = req.body.about;
    if (req.body.languages)
      consultant.languages = req.body.languages
        .split(",")
        .map((lang) => lang.trim());
    if (req.body.expectedFee) consultant.expectedFee = req.body.expectedFee;

    // Handle profile photo update (local storage)
    if (req.files?.profilePhoto) {
      consultant.user.profilePhoto = {
        url: `/uploads/${req.files.profilePhoto[0].filename}`,
      };
    }

    // Handle resume update (local storage)
    if (req.files?.resume) {
      consultant.resume = {
        url: `/uploads/${req.files.resume[0].filename}`,
      };
    }

    // Handle certifications (local storage)
    if (req.files?.certifications) {
      for (let i = 0; i < req.files.certifications.length; i++) {
        const file = req.files.certifications[i];

        // Get certification name from body
        const certName =
          req.body.certifications?.[i]?.name || file.originalname;

        // Add to verification documents
        consultant.verification.documents.push({
          name: certName,
          url: `/uploads/${file.filename}`,
        });
      }
    }

    // Save all changes
    await consultant.user.save();
    await consultant.verification.save();
    const updatedConsultant = await consultant.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedConsultant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultant by ID
// @route   GET /api/consultants/:id
export const getConsultantById = async (req, res, next) => {
  try {
    const consultant = await Consultant.findById(req.params.id)
      .populate(
        "user",
        "name email contactNumber location linkedInProfile profilePhoto"
      )
      .populate("verification");

    if (!consultant) {
      return notFoundError("Consultant not found", res);
    }

    res.json({
      success: true,
      data: consultant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultant profile
// @route   GET /api/consultants/profile/:consultant_id
export const getConsultantProfile = async (req, res, next) => {
  try {
    const { consultant_id } = req.params;

    if (!consultant_id) {
      return res.status(400).json({
        success: false,
        message: "Consultant ID is required",
      });
    }

    const consultant = await Consultant.findById(consultant_id)
      .populate(
        "user",
        "name email contactNumber location linkedInProfile profilePhoto"
      )
      .populate("verification");

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: consultant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove certification
// @route   DELETE /api/consultants/certifications/:id
export const removeCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultant = await Consultant.findOne({
      user: req.user._id,
    }).populate("verification");

    if (!consultant) {
      return notFoundError("Consultant profile not found", res);
    }

    // Find certification in verification documents
    const certIndex = consultant.verification.documents.findIndex(
      (doc) => doc._id.toString() === id
    );

    if (certIndex === -1) {
      return notFoundError("Certification not found", res);
    }

    // Remove from array
    consultant.verification.documents.splice(certIndex, 1);
    await consultant.verification.save();

    res.json({
      success: true,
      message: "Certification removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
