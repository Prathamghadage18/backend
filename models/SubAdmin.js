import mongoose from "mongoose";

const subAdminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Assigned regions/categories for moderation
    assignedRegions: [
      {
        type: String,
        enum: ["north", "south", "east", "west", "central", "all"],
        default: ["all"],
      },
    ],
    assignedCategories: [
      {
        type: String,
        enum: [
          "technology",
          "business",
          "healthcare",
          "education",
          "finance",
          "all",
        ],
        default: ["all"],
      },
    ],
    // Permission levels
    permissions: [
      {
        type: String,
        enum: [
          "consultant_management",
          "verification_management",
          "basic_analytics",
          "profile_management",
          "moderation",
          "document_review",
          "customer_support",
        ],
        default: [
          "consultant_management",
          "verification_management",
          "basic_analytics",
          "profile_management",
          "moderation",
        ],
      },
    ],
    // Work schedule and availability
    workSchedule: {
      startTime: {
        type: String,
        default: "09:00",
      },
      endTime: {
        type: String,
        default: "17:00",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      workingDays: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
          default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
      ],
    },
    // Performance metrics
    performance: {
      totalReviews: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number, // in minutes
        default: 0,
      },
      accuracy: {
        type: Number, // percentage
        default: 100,
      },
      lastReviewDate: Date,
    },
    // Supervisor/admin who assigned this sub-admin
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Status of sub-admin account
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    // Notes from supervisors
    supervisorNotes: [
      {
        note: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Training and certification
    certifications: [
      {
        name: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
        status: {
          type: String,
          enum: ["active", "expired", "pending"],
          default: "active",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for efficient queries
subAdminSchema.index({ user: 1 });
subAdminSchema.index({ status: 1 });
subAdminSchema.index({ assignedRegions: 1 });
subAdminSchema.index({ assignedCategories: 1 });

// Virtual for full name
subAdminSchema.virtual("fullName").get(function () {
  return this.user ? this.user.name : "Unknown";
});

// Method to check if sub-admin has specific permission
subAdminSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Method to check if sub-admin can moderate specific region/category
subAdminSchema.methods.canModerate = function (region, category) {
  const canModerateRegion =
    this.assignedRegions.includes("all") ||
    this.assignedRegions.includes(region);
  const canModerateCategory =
    this.assignedCategories.includes("all") ||
    this.assignedCategories.includes(category);

  return canModerateRegion && canModerateCategory;
};

// Method to update performance metrics
subAdminSchema.methods.updatePerformance = function (reviewTime, accuracy) {
  this.performance.totalReviews += 1;
  this.performance.lastReviewDate = new Date();

  // Update average response time
  if (this.performance.averageResponseTime === 0) {
    this.performance.averageResponseTime = reviewTime;
  } else {
    this.performance.averageResponseTime =
      (this.performance.averageResponseTime + reviewTime) / 2;
  }

  // Update accuracy
  if (this.performance.accuracy === 100) {
    this.performance.accuracy = accuracy;
  } else {
    this.performance.accuracy = (this.performance.accuracy + accuracy) / 2;
  }
};

// Pre-save middleware to validate permissions
subAdminSchema.pre("save", function (next) {
  // Ensure at least basic permissions are assigned
  if (this.permissions.length === 0) {
    this.permissions = [
      "consultant_management",
      "verification_management",
      "basic_analytics",
      "profile_management",
      "moderation",
    ];
  }

  // Ensure at least one region is assigned
  if (this.assignedRegions.length === 0) {
    this.assignedRegions = ["all"];
  }

  // Ensure at least one category is assigned
  if (this.assignedCategories.length === 0) {
    this.assignedCategories = ["all"];
  }

  next();
});

export default mongoose.model("SubAdmin", subAdminSchema);
