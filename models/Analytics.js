import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    totalConsultants: {
      type: Number,
      default: 0,
    },
    totalCustomers: {
      type: Number,
      default: 0,
    },
    activeSessions: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    transactions: {
      type: Number,
      default: 0,
    },
    userDistribution: {
      consultants: Number,
      customers: Number,
      admins: Number,
    },
  },
  { timestamps: true }
);

// Pre-save hook to create daily analytics
analyticsSchema.pre("save", async function (next) {
  if (this.isNew) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.date = today;
  }
  next();
});

export default mongoose.model("Analytics", analyticsSchema);
