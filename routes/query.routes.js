import express from "express";
import {
  getConsultantQueries,
  createQuery,
  updateQueryStatus,
  getQueryById,
} from "../controllers/query.controller.js";
import { protect, consultant, user as customer } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// User routes
router.post("/", protect, customer, upload.array("supportDocs"), createQuery);

// Consultant routes
router.get("/", protect, consultant, getConsultantQueries);
router.get("/:id", protect, consultant, getQueryById);
router.put("/:id", protect, consultant, updateQueryStatus);

export default router;
