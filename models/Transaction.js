// models/Transaction.js
import mongoose from "mongoose";
import { TRANSACTION_STATUS } from "../config/constants.js"; // Add this import

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS), // Now properly defined
      default: TRANSACTION_STATUS.PENDING,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
