import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getConsultants,
  getConsultantById,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protected user profile routes
router
  .route("/profile/:id")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Public consultant listing (no auth required for browsing)
router.route("/consultants").get(getConsultants);

// Public consultant profile view (no auth required)
router.route("/consultants/:id").get(getConsultantById);

export default router;
