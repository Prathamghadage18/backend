import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import { notFoundError } from "../utils/helpers.js";

// @desc    Upload a document
// @route   POST /api/documents
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const document = new Document({
      user: req.user._id,
      name: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      publicId: req.file.filename,
      size: req.file.size,
      fileType: req.file.mimetype,
    });

    await document.save();

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all documents for a user
// @route   GET /api/documents
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user._id });
    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a document
// @route   GET /api/documents/:id/download
export const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return notFoundError("Document not found", res);
    }

    // Serve the file from local uploads directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "../..", document.fileUrl);

    if (!fs.existsSync(filePath)) {
      return notFoundError("File not found on server", res);
    }

    res.download(filePath, document.name);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return notFoundError("Document not found", res);
    }

    // Delete local file if exists
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(
      __dirname,
      "../..",
      "uploads",
      document.publicId
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
