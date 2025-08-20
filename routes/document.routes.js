import express from "express";
import { protect } from "../middleware/auth.js"; // Import named export
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  downloadDocument,
} from "../controllers/document.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply authentication middleware to all document routes
router.use(protect); // Use the named export

// Upload a document
router.post("/", upload.single("file"), uploadDocument);

// Get all documents for a user
router.get("/", getDocuments);

// Download a document
router.get("/:id/download", downloadDocument);

// Delete a document
router.delete("/:id", deleteDocument);

export default router;
