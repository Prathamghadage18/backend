import mongoose from "mongoose";
import { QUERY_STATUS, SESSION_TYPES } from "../config/constants.js";

const querySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    consultant: { type: mongoose.Schema.Types.ObjectId, ref: "Consultant", required: true },
    querySub: { type: String, required: true },
    queryText: { type: String, required: true },

    // New Fields
    sessionDateTime: { type: String },
    duration: { type: String },
    sessionLink: { type: String },

    files: [
      { name: String, url: String, publicId: String },
    ],
    fee: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(QUERY_STATUS),
      default: QUERY_STATUS.PENDING,
    },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  },
  { timestamps: true }
);


export default mongoose.model("Query", querySchema);
