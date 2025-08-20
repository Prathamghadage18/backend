// Protect routes
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Consultant from "../models/Consultant.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ If consultant, attach consultantProfile ID
    if (req.user.role === "consultant") {
      const consultantProfile = await Consultant.findOne({ user: req.user._id });
      if (consultantProfile) {
        req.user.consultantProfile = consultantProfile._id;
      }
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export { protect };

// Role-based middleware
export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
});

export const consultant = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "consultant") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a consultant");
  }
});

export const subAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "sub-admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a sub-admin");
  }
});

export const user = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "user") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a user");
  }
});
