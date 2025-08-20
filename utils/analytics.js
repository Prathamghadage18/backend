import Analytics from "../models/Analytics.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Transaction from "../models/Transaction.js";
import { USER_ROLES } from "../config/constants.js";

// Update analytics data for the current day
export const updateDailyAnalytics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const totalConsultants = await User.countDocuments({
      role: USER_ROLES.CONSULTANT,
    });
    const totalCustomers = await User.countDocuments({
      role: USER_ROLES.CUSTOMER,
    });

    const activeSessions = await Session.countDocuments({
      status: "active",
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() },
    });

    const todayTransactions = await Transaction.find({
      createdAt: {
        $gte: today,
        $lt: new Date(),
      },
      status: "completed",
    });

    const revenue = todayTransactions.reduce((sum, tx) => sum + tx.fee, 0);

    const analyticsData = {
      totalUsers,
      totalConsultants,
      totalCustomers,
      activeSessions,
      revenue,
      transactions: todayTransactions.length,
      userDistribution: {
        consultants: totalConsultants,
        customers: totalCustomers,
        admins: await User.countDocuments({ role: USER_ROLES.ADMIN }),
      },
    };

    await Analytics.findOneAndUpdate({ date: today }, analyticsData, {
      upsert: true,
      new: true,
    });

    console.log("Daily analytics updated successfully");
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
};

// Get analytics data for a date range
export const getAnalyticsData = async (startDate, endDate) => {
  try {
    const data = await Analytics.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    return data;
  } catch (error) {
    throw new Error("Error fetching analytics data");
  }
};
