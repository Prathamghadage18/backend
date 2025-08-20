import mongoose from "mongoose";
import { CONSULTANT_STATUS } from "../config/constants.js";

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  issuedDate: Date,
  issuingOrganization: String,
});

const consultantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    location: { type: String, required: true },
    linkedInProfile: { type: String },
    designation: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    languages: {
      type: [String],
      required: true,
    },
    expectedFee: {
      type: Number,
      required: true,
    },
    resume: {
      url: String,
    },
    certifications: [certificationSchema],
    status: {
      type: String,
      enum: Object.values(CONSULTANT_STATUS),
      default: CONSULTANT_STATUS.PENDING,
    },
    verification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Verification",
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual for average rating
consultantSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;

  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / this.reviews.length;
});

export default mongoose.model("Consultant", consultantSchema);
