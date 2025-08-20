import User from "../models/User.js";
import Consultant from "../models/Consultant.js";
import Verification from "../models/Verification.js";
import Transaction from "../models/Transaction.js";
import { CONSULTANT_STATUS, VERIFICATION_STATUS } from "../config/constants.js";
import { getAnalyticsData } from "../utils/analytics.js";
import Customer from "../models/Customer.js";

// -----------------------------
// Get all consultants
// -----------------------------
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
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: consultants.length,
      data: consultants,
    });
  } catch (error) {
    console.error("getConsultants error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Get only approved consultants
// -----------------------------
export const getConsultantsByStatus = async (req, res) => {
  try {
    const consultants = await Consultant.find({
      status: CONSULTANT_STATUS.APPROVED,
    }).populate(
      "user",
      "name email contactNumber location linkedInProfile profilePhoto"
    );


    if (!consultants.length) {
      return res.status(404).json({
        success: false,
        message: `No consultants with status: approved`,
      });
    }

    res.status(200).json({
      success: true,
      count: consultants.length,
      data: consultants,
    });
  } catch (error) {
    console.error("getConsultantsByStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Update consultant status
// -----------------------------
export const updateConsultantStatus = async (req, res) => {
  try {
    const { id } = req.params; // consultantId
    const { status, rejectionReason } = req.body;

    const consultant = await Consultant.findById(id).populate("user");
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    consultant.status = status;
    if (status === CONSULTANT_STATUS.REJECTED && rejectionReason) {
      consultant.rejectionReason = rejectionReason;
    }
    await consultant.save();

    // If consultant approved → update Verification of the User
    if (status === CONSULTANT_STATUS.APPROVED) {
      await Verification.findOneAndUpdate(
        { consultant: consultant.user._id }, // Verification references User
        { status: VERIFICATION_STATUS.VERIFIED },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Consultant status updated successfully",
      data: consultant,
    });
  } catch (error) {
    console.error("updateConsultantStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Get all customers
// -----------------------------
export const getCustomers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { role: "user" };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("getCustomers error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Get all transactions
// -----------------------------
export const getTransactions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { "customer.name": { $regex: search, $options: "i" } },
        { "consultant.name": { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate("customer", "name email")
      .populate("consultant", "name email")
      .populate("session")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("getTransactions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Get verifications
// -----------------------------
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
      .populate("consultant", "name email") // consultant is User
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    console.error("getVerifications error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Update verification status
// -----------------------------
export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params; // verificationId
    const { status, rejectionReason } = req.body;

    const verification = await Verification.findById(id).populate("consultant");
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification not found",
      });
    }

    verification.status = status;
    verification.reviewedBy = req.user?._id || null;
    verification.reviewDate = new Date();

    if (status === VERIFICATION_STATUS.REJECTED && rejectionReason) {
      verification.rejectionReason = rejectionReason;
    }
    await verification.save();

    // If verification approved → update Consultant (linked to this User)
    if (status === VERIFICATION_STATUS.VERIFIED) {
      await Consultant.findOneAndUpdate(
        { user: verification.consultant._id }, // Consultant references User
        { status: CONSULTANT_STATUS.APPROVED },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Verification status updated successfully",
      data: verification,
    });
  } catch (error) {
    console.error("updateVerificationStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// -----------------------------
// Get analytics data
// -----------------------------
export const getAnalytics = async (req, res) => {
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
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const analyticsData = await getAnalyticsData(startDate, endDate);

    const summary = {
      totalUsers: 0,
      totalConsultants: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      totalSessions: 0,
      userDistribution: { consultants: 0, customers: 0, admins: 0 },
    };

    if (analyticsData.length > 0) {
      const latest = analyticsData[analyticsData.length - 1];
      summary.totalUsers = latest.totalUsers;
      summary.totalConsultants = latest.totalConsultants;
      summary.totalCustomers = latest.totalCustomers;
      summary.totalRevenue = analyticsData.reduce(
        (sum, d) => sum + d.revenue,
        0
      );
      summary.totalSessions = analyticsData.reduce(
        (sum, d) => sum + d.transactions,
        0
      );
      summary.userDistribution = latest.userDistribution;
    }

    res.json({
      success: true,
      data: { summary, analytics: analyticsData },
    });
  } catch (error) {
    console.error("getAnalytics error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


// Delete Consultant
export const deleteConsultant = async (req, res) => {
  try {
    const { id } = req.params; // ✅ get id from URL param

    const consultant = await Consultant.findById(id).populate("user");
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    // Delete consultant
    await consultant.deleteOne();

    // Optionally delete linked User as well
    if (consultant.user) {
      await User.findByIdAndDelete(consultant.user._id);
    }

    res.json({
      success: true,
      message: "Consultant deleted successfully",
    });
  } catch (error) {
    console.error("deleteConsultant error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).populate("user");
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    await customer.deleteOne();
    if (customer.user) {
      await User.findByIdAndDelete(customer.user._id);
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};



// controllers/customerController.js
export const updateCustomerStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: `Customer status updated to ${status}`,
      customer,
    });
  } catch (error) {
    console.error("updateCustomerStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

