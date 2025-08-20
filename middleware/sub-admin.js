import asyncHandler from "express-async-handler";

// Sub-admin permission levels
export const SUB_ADMIN_PERMISSIONS = {
  CONSULTANT_MANAGEMENT: "consultant_management",
  VERIFICATION_MANAGEMENT: "verification_management",
  BASIC_ANALYTICS: "basic_analytics",
  PROFILE_MANAGEMENT: "profile_management",
  MODERATION: "moderation",
};

// Check if sub-admin has specific permission
export const hasPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== "sub-admin") {
      return res.status(403).json({
        message: "Access denied. Sub-admin role required.",
      });
    }

    // For now, all sub-admins have all permissions
    // In the future, you can implement permission-based access control
    // by adding a permissions array to the User model

    // Example of future implementation:
    // if (!req.user.permissions || !req.user.permissions.includes(permission)) {
    //   return res.status(403).json({
    //     message: `Access denied. Permission '${permission}' required.`
    //   });
    // }

    next();
  });
};

// Audit logging for sub-admin actions
export const auditSubAdminAction = (action) => {
  return asyncHandler(async (req, res, next) => {
    // Log the action for audit purposes
    const auditLog = {
      timestamp: new Date(),
      userId: req.user._id,
      userEmail: req.user.email,
      action: action,
      resource: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    // You can store this in a separate audit collection
    // For now, we'll just log it to console
    console.log("Sub-Admin Audit Log:", auditLog);

    next();
  });
};

// Rate limiting for sub-admin actions
export const subAdminRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
};

// Validate sub-admin scope (prevent access to admin-only resources)
export const validateSubAdminScope = asyncHandler(async (req, res, next) => {
  // Prevent sub-admin from accessing admin-only endpoints
  const adminOnlyPaths = ["/api/admin", "/api/users/admin", "/api/system"];

  const isAdminPath = adminOnlyPaths.some((path) =>
    req.originalUrl.startsWith(path)
  );

  if (isAdminPath) {
    return res.status(403).json({
      message:
        "Access denied. This resource is restricted to admin users only.",
    });
  }

  next();
});

// Check if sub-admin can modify specific resource
export const canModifyResource = (resourceType) => {
  return asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next();
    }

    try {
      let resource;

      switch (resourceType) {
        case "consultant":
          const Consultant = (await import("../models/Consultant.js")).default;
          resource = await Consultant.findById(id);
          break;
        case "verification":
          const Verification = (await import("../models/Verification.js"))
            .default;
          resource = await Verification.findById(id);
          break;
        default:
          return next();
      }

      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Sub-admins can only modify resources that are in pending status
      // or resources they have reviewed
      if (
        resource.status !== "pending" &&
        resource.reviewedBy?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "Access denied. You can only modify pending resources or resources you have reviewed.",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
};

// Export all middleware functions
export default {
  hasPermission,
  auditSubAdminAction,
  subAdminRateLimit,
  validateSubAdminScope,
  canModifyResource,
};
