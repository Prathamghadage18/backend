import express from "express";
import { protect, subAdmin } from "../middleware/auth.js";
import {
  hasPermission,
  auditSubAdminAction,
  validateSubAdminScope,
  canModifyResource,
} from "../middleware/sub-admin.js";
import {
  getConsultants,
  getConsultantsByStatus,
  updateConsultantStatus,
  getVerifications,
  updateVerificationStatus,
  getBasicAnalytics,
  getSubAdminProfile,
  updateSubAdminProfile,
  getModerationQueue,
} from "../controllers/sub-admin.controller.js";

const router = express.Router();

// Apply authentication and sub-admin role middleware to all routes
router.use(protect);
router.use(subAdmin);
router.use(validateSubAdminScope);

// Profile management
router.get("/profile", hasPermission("profile_management"), getSubAdminProfile);
router.put(
  "/profile",
  hasPermission("profile_management"),
  auditSubAdminAction("profile_update"),
  updateSubAdminProfile
);

// Consultant management (limited scope)
router.get(
  "/consultants",
  hasPermission("consultant_management"),
  getConsultants
);
router.get(
  "/consultants/status/:status",
  hasPermission("consultant_management"),
  getConsultantsByStatus
);
router.put(
  "/consultants/:id/status",
  hasPermission("consultant_management"),
  auditSubAdminAction("consultant_status_update"),
  canModifyResource("consultant"),
  updateConsultantStatus
);

// Verification management (limited scope)
router.get(
  "/verifications",
  hasPermission("verification_management"),
  getVerifications
);
router.put(
  "/verifications/:id/status",
  hasPermission("verification_management"),
  auditSubAdminAction("verification_status_update"),
  canModifyResource("verification"),
  updateVerificationStatus
);

// Moderation queue
router.get(
  "/moderation-queue",
  hasPermission("moderation"),
  getModerationQueue
);

// Basic analytics (limited scope)
router.get("/analytics", hasPermission("basic_analytics"), getBasicAnalytics);

export default router;
