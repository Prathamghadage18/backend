import User from "../models/User.js";
import Consultant from "../models/Consultant.js";
import Verification from "../models/Verification.js";
import Transaction from "../models/Transaction.js";
import {
  CONSULTANT_STATUS,
  VERIFICATION_STATUS,
  TRANSACTION_STATUS,
} from "../config/constants.js";
import { getAnalyticsData } from "../utils/analytics.js";

// Get consultants within sub-admin's scope (basic filtering)
export const getConsultants = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const consultants = await Consultant.find(filter)
      .populate("user", "name email profilePhoto")
      .sort({ createdAt: -1 })
      .limit(100); // Limit results for sub-admin scope

    res.json({
      success: true,
      count: consultants.length,
      data: consultants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get consultants by status (limited scope)
export const getConsultantsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const consultants = await Consultant.find({ status })
      .populate("user", "name email profilePhoto")
      .limit(50);

    if (!consultants.length) {
      return res.status(404).json({
        success: false,
        message: `No consultants with status: ${status}`,
      });
    }

    res.status(200).json({
      success: true,
      count: consultants.length,
      data: consultants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update consultant status (limited to pending/approved/rejected)
export const updateConsultantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate status for sub-admin permissions
    if (
      ![
        CONSULTANT_STATUS.PENDING,
        CONSULTANT_STATUS.APPROVED,
        CONSULTANT_STATUS.REJECTED,
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status for sub-admin",
      });
    }

    const consultant = await Consultant.findById(id).populate("user");

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    consultant.status = status;
    consultant.reviewedBy = req.user._id;
    consultant.reviewDate = new Date();

    if (status === CONSULTANT_STATUS.REJECTED && rejectionReason) {
      consultant.rejectionReason = rejectionReason;
    }

    await consultant.save();

    // Update verification status if approved
    if (status === CONSULTANT_STATUS.APPROVED) {
      await Verification.findOneAndUpdate(
        { consultant: consultant.user._id },
        {
          status: VERIFICATION_STATUS.VERIFIED,
          reviewedBy: req.user._id,
          reviewDate: new Date(),
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Consultant status updated successfully",
      data: consultant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get verifications within sub-admin scope
export const getVerifications = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { "consultant.name": { $regex: search, $options: "i" } },
        { "consultant.email": { $regex: search, $options: "i" } },
      ];
    }

    const verifications = await Verification.find(filter)
      .populate({
        path: "consultant",
        select: "name email",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update verification status (limited scope)
export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate status for sub-admin permissions
    if (
      ![
        VERIFICATION_STATUS.PENDING,
        VERIFICATION_STATUS.VERIFIED,
        VERIFICATION_STATUS.REJECTED,
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status for sub-admin",
      });
    }

    const verification = await Verification.findById(id).populate("consultant");

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification not found",
      });
    }

    verification.status = status;
    verification.reviewedBy = req.user._id;
    verification.reviewDate = new Date();

    if (status === VERIFICATION_STATUS.REJECTED && rejectionReason) {
      verification.rejectionReason = rejectionReason;
    }

    await verification.save();

    // Update consultant status if verified
    if (status === VERIFICATION_STATUS.VERIFIED) {
      await Consultant.findOneAndUpdate(
        { user: verification.consultant._id },
        {
          status: CONSULTANT_STATUS.APPROVED,
          reviewedBy: req.user._id,
          reviewDate: new Date(),
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Verification status updated successfully",
      data: verification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get basic analytics data (limited scope)
export const getBasicAnalytics = async (req, res) => {
  try {
    const { range = "7d" } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (range) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get basic counts for sub-admin scope
    const totalConsultants = await Consultant.countDocuments();
    const pendingConsultants = await Consultant.countDocuments({
      status: CONSULTANT_STATUS.PENDING,
    });
    const approvedConsultants = await Consultant.countDocuments({
      status: CONSULTANT_STATUS.APPROVED,
    });
    const rejectedConsultants = await Consultant.countDocuments({
      status: CONSULTANT_STATUS.REJECTED,
    });

    const totalVerifications = await Verification.countDocuments();
    const pendingVerifications = await Verification.countDocuments({
      status: VERIFICATION_STATUS.PENDING,
    });
    const verifiedVerifications = await Verification.countDocuments({
      status: VERIFICATION_STATUS.VERIFIED,
    });

    // Get recent transactions count
    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const analyticsData = {
      summary: {
        totalConsultants,
        pendingConsultants,
        approvedConsultants,
        rejectedConsultants,
        totalVerifications,
        pendingVerifications,
        verifiedVerifications,
        recentTransactions,
      },
      range: {
        startDate,
        endDate,
      },
    };

    res.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get sub-admin profile
export const getSubAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update sub-admin profile
export const updateSubAdminProfile = async (req, res) => {
  try {
    const { name, contactNumber, location } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only allow updating certain fields
    if (name) user.name = name;
    if (contactNumber) user.contactNumber = contactNumber;
    if (location) user.location = location;

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get moderation queue (consultants pending review)
export const getModerationQueue = async (req, res) => {
  try {
    const pendingConsultants = await Consultant.find({
      status: CONSULTANT_STATUS.PENDING,
    })
      .populate("user", "name email profilePhoto")
      .sort({ createdAt: 1 })
      .limit(50);

    const pendingVerifications = await Verification.find({
      status: VERIFICATION_STATUS.PENDING,
    })
      .populate("consultant", "name email")
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        pendingConsultants,
        pendingVerifications,
        totalPending: pendingConsultants.length + pendingVerifications.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
