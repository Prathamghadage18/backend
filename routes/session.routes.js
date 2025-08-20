import express from "express";
import {
  getConsultantSessions,
  getSessionDetails,
  createFollowUpSession,
  addSessionDocument,
} from "../controllers/session.controller.js";
import { protect, consultant } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply auth middleware
router.use(protect, consultant);

// Get all sessions (optionally filter by today)
router.get("/", getConsultantSessions);

// Get specific session details by ID
router.get("/:id", getSessionDetails);

// Create follow-up session
router.post("/follow-up", createFollowUpSession);

// Add document to a session
router.post(
  "/:sessionId/documents",
  upload.single("document"),
  addSessionDocument
);

export default router;
