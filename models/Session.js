import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    query: {
      // Add reference to the original query
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    type: {
      type: String,
      enum: ["video", "audio", "in-person"], // Updated enum values
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    meetingLink: String,
    notes: String,
    documents: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    followUpSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    parentSession: {
      // Track parent session for follow-ups
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for session ID
sessionSchema.virtual("sessionId").get(function () {
  return `SES-${this._id.toString().slice(-6).toUpperCase()}`;
});

export default mongoose.model("Session", sessionSchema);
