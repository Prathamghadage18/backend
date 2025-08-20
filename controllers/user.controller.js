import User from "../models/User.js";
import Consultant from "../models/Consultant.js";
import { notFoundError } from "../utils/helpers.js";

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return notFoundError("User not found", res);
    }

    let profile = { ...user._doc };

    if (user.role === "consultant") {
      const consultantProfile = await Consultant.findOne({ user: user._id });
      if (consultantProfile) {
        profile = {
          ...profile,
          ...consultantProfile._doc,
          consultantId: consultantProfile._id, // Add consultant ID
        };
      }
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};
// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return notFoundError("User not found", res);
    }

    const { name, email, password } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all consultants (public endpoint)
// @route   GET /api/users/consultants
export const getConsultants = async (req, res, next) => {
  try {
    const {
      domain,
      minExperience,
      maxExperience,
      minFee,
      maxFee,
      minRating,
      search,
    } = req.query;

    const filter = { status: "approved" };

    // Domain filter
    if (domain) {
      filter.skills = { $in: [domain] };
    }

    // Experience filter
    if (minExperience || maxExperience) {
      filter.yearsOfExperience = {};
      if (minExperience)
        filter.yearsOfExperience.$gte = parseInt(minExperience);
      if (maxExperience)
        filter.yearsOfExperience.$lte = parseInt(maxExperience);
    }

    // Fee filter
    if (minFee || maxFee) {
      filter.expectedFee = {};
      if (minFee) filter.expectedFee.$gte = parseInt(minFee);
      if (maxFee) filter.expectedFee.$lte = parseInt(maxFee);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { name: searchRegex },
        { skills: searchRegex },
        { company: searchRegex },
        { designation: searchRegex },
      ];
    }

    const consultants = await Consultant.find(filter)
      .populate("user", "name email profilePhoto")
      .select("-certifications -resume -verification")
      .sort({ rating: -1, yearsOfExperience: -1 });

    res.json({
      success: true,
      count: consultants.length,
      data: consultants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultant by ID (public endpoint)
// @route   GET /api/users/consultants/:id
export const getConsultantById = async (req, res, next) => {
  try {
    const consultant = await Consultant.findOne({
      _id: req.params.id,
      status: "approved",
    })
      .populate("user", "name email profilePhoto")
      .select("-certifications -resume -verification");

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
