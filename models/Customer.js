import mongoose from "mongoose";
import { CONSULTATION_STATUS } from "../config/constants.js";

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

     linkedInProfile: { type: String },
    companyName: String,
    companyDetails: String,
    serviceArea: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
      required: true,
    },
    urgentRequest: {
      type: Boolean,
      default: false,
    },
    files: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: Object.values(CONSULTATION_STATUS),
      default: CONSULTATION_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CustomerSchema", customerSchema);
