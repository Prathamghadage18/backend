import Payment from "../models/Payment.js";
import Session from "../models/Session.js";
import { notFoundError } from "../utils/helpers.js";

// Get consultant payments
export const getConsultantPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ consultant: req.user._id })
      .populate("session")
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};
