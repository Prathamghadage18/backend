import express from "express";
import {
  updateConsultantProfile,
  getConsultantProfile,
  removeCertification,
  getConsultantById,
} from "../controllers/consultant.controller.js";
import { protect, consultant } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply authentication and consultant role middleware
router.use(protect);

// Get consultant profile
router.get("/profile", consultant, getConsultantProfile);

// Get consultant profile by ID
router.get("/profile/:id", getConsultantById);

// Update consultant profile
router.put(
  "/profile",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "certifications", maxCount: 10 },
  ]),
  consultant,
  updateConsultantProfile
);

// Remove certification
router.delete("/certifications/:id", consultant, removeCertification);

export default router;
