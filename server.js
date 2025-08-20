import express from "express";
import http from "http";
import { initWebSocket } from "./websocket.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import cors from "cors";

// Import all route files
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import consultantRoutes from "./routes/consultant.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import queryRoutes from "./routes/query.routes.js";
import documentRoutes from "./routes/document.routes.js";
import adminRoutes from "./routes/admin.routes.js"; // Add admin routes
import subAdminRoutes from "./routes/sub-admin.routes.js"; // Add sub-admin routes
import { updateDailyAnalytics } from "./utils/analytics.js"; // Import analytics update function
//import { cleanupUploads } from "./middleware/upload.js";
import customerRouter from "./routes/customer.routes.js";

// Configure environment variables
dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = initWebSocket(server); // Attach WebSocket to it
app.set("socketio", io); // Make io accessible in routes

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
//app.use(cleanupUploads);
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // Serve static files
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// API Routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes); // Admin routes
app.use("/api/sub-admin", subAdminRoutes); // Sub-admin routes
app.use("/api/customer", customerRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  // Serve the frontend
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"))
  );
} else {
  // Basic route for development
  app.get("/", (req, res) => {
    res.json({
      message: "API is running...",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });
}

// Error handling middleware (must be after all other middleware/routes)
app.use(notFound);
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Schedule daily analytics update (runs at 11:59 PM every day)
  if (process.env.NODE_ENV !== "test") {
    const now = new Date();
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      0
    );

    const timeUntilTarget = targetTime - now;

    if (timeUntilTarget < 0) {
      // If it's already past 11:59 PM, schedule for tomorrow
      targetTime.setDate(targetTime.getDate() + 1);
    }

    setTimeout(() => {
      // Run immediately and then every 24 hours
      updateDailyAnalytics();
      setInterval(updateDailyAnalytics, 24 * 60 * 60 * 1000);
    }, timeUntilTarget);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

app.get("/api/example", (req, res) => {
  res.json({ message: "Backend is connected successfully!" });
});

export default app;
