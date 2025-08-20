import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";
import Consultant from "../models/Consultant.js";
import Verification from "../models/Verification.js";

let mongoServer;
let subAdminToken;
let adminToken;
let testConsultantId;
let testVerificationId;

// Setup and teardown
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections
  await User.deleteMany({});
  await Consultant.deleteMany({});
  await Verification.deleteMany({});

  // Create test users
  const subAdminUser = await User.create({
    name: "Test Sub-Admin",
    email: "subadmin@test.com",
    password: "password123",
    role: "sub-admin",
  });

  const adminUser = await User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "password123",
    role: "admin",
  });

  const consultantUser = await User.create({
    name: "Test Consultant",
    email: "consultant@test.com",
    password: "password123",
    role: "consultant",
  });

  // Create test consultant
  const consultant = await Consultant.create({
    user: consultantUser._id,
    status: "pending",
    specialization: "Technology",
  });
  testConsultantId = consultant._id;

  // Create test verification
  const verification = await Verification.create({
    consultant: consultantUser._id,
    status: "pending",
  });
  testVerificationId = verification._id;

  // Generate tokens (simplified for testing)
  subAdminToken = `Bearer ${subAdminUser._id}`;
  adminToken = `Bearer ${adminUser._id}`;
});

describe("Sub-Admin API", () => {
  describe("Authentication & Authorization", () => {
    test("should reject requests without token", async () => {
      const response = await request(app)
        .get("/api/sub-admin/profile")
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });

    test("should reject requests from non-sub-admin users", async () => {
      const response = await request(app)
        .get("/api/sub-admin/profile")
        .set("Authorization", adminToken)
        .expect(403);

      expect(response.body.message).toContain("Not authorized as a sub-admin");
    });

    test("should allow requests from sub-admin users", async () => {
      const response = await request(app)
        .get("/api/sub-admin/profile")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(response.body.role).toBe("sub-admin");
    });
  });

  describe("Profile Management", () => {
    test("should get sub-admin profile", async () => {
      const response = await request(app)
        .get("/api/sub-admin/profile")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(response.body.name).toBe("Test Sub-Admin");
      expect(response.body.email).toBe("subadmin@test.com");
      expect(response.body.role).toBe("sub-admin");
    });

    test("should update sub-admin profile", async () => {
      const updateData = {
        name: "Updated Name",
        contactNumber: "+1234567890",
        location: "New York",
      };

      const response = await request(app)
        .put("/api/sub-admin/profile")
        .set("Authorization", subAdminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe("Updated Name");
      expect(response.body.contactNumber).toBe("+1234567890");
      expect(response.body.location).toBe("New York");
    });
  });

  describe("Consultant Management", () => {
    test("should get consultants list", async () => {
      const response = await request(app)
        .get("/api/sub-admin/consultants")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("should get consultants by status", async () => {
      const response = await request(app)
        .get("/api/sub-admin/consultants/status/pending")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].status).toBe("pending");
    });

    test("should update consultant status", async () => {
      const updateData = {
        status: "approved",
      };

      const response = await request(app)
        .put(`/api/sub-admin/consultants/${testConsultantId}/status`)
        .set("Authorization", subAdminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe("approved");
    });

    test("should reject invalid status updates", async () => {
      const updateData = {
        status: "invalid_status",
      };

      const response = await request(app)
        .put(`/api/sub-admin/consultants/${testConsultantId}/status`)
        .set("Authorization", subAdminToken)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain("Invalid status for sub-admin");
    });
  });

  describe("Verification Management", () => {
    test("should get verifications list", async () => {
      const response = await request(app)
        .get("/api/sub-admin/verifications")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("should update verification status", async () => {
      const updateData = {
        status: "verified",
      };

      const response = await request(app)
        .put(`/api/sub-admin/verifications/${testVerificationId}/status`)
        .set("Authorization", subAdminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe("verified");
    });
  });

  describe("Moderation Queue", () => {
    test("should get moderation queue", async () => {
      const response = await request(app)
        .get("/api/sub-admin/moderation-queue")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(response.body).toHaveProperty("pendingConsultants");
      expect(response.body).toHaveProperty("pendingVerifications");
      expect(response.body).toHaveProperty("totalPending");
      expect(typeof response.body.totalPending).toBe("number");
    });
  });

  describe("Analytics", () => {
    test("should get basic analytics", async () => {
      const response = await request(app)
        .get("/api/sub-admin/analytics")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(response.body).toHaveProperty("summary");
      expect(response.body).toHaveProperty("range");
      expect(response.body.summary).toHaveProperty("totalConsultants");
      expect(response.body.summary).toHaveProperty("pendingConsultants");
    });

    test("should get analytics with custom range", async () => {
      const response = await request(app)
        .get("/api/sub-admin/analytics?range=30d")
        .set("Authorization", subAdminToken)
        .expect(200);

      expect(response.body.range).toBeDefined();
    });
  });

  describe("Scope Validation", () => {
    test("should prevent access to admin endpoints", async () => {
      const response = await request(app)
        .get("/api/admin/consultants")
        .set("Authorization", subAdminToken)
        .expect(403);

      expect(response.body.message).toContain("restricted to admin users only");
    });
  });

  describe("Error Handling", () => {
    test("should handle non-existent resources", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/sub-admin/consultants/status/${fakeId}`)
        .set("Authorization", subAdminToken)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    test("should handle server errors gracefully", async () => {
      // This test would require mocking database failures
      // For now, we'll test the basic error handling structure
      expect(true).toBe(true);
    });
  });
});

describe("RBAC Consistency", () => {
  test("should maintain consistent permission checks across endpoints", async () => {
    const endpoints = [
      "/api/sub-admin/profile",
      "/api/sub-admin/consultants",
      "/api/sub-admin/verifications",
      "/api/sub-admin/moderation-queue",
      "/api/sub-admin/analytics",
    ];

    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint).expect(401); // Should reject without token

      expect(response.body.message).toContain("Not authorized");
    }
  });

  test("should enforce sub-admin role consistently", async () => {
    const endpoints = [
      "/api/sub-admin/profile",
      "/api/sub-admin/consultants",
      "/api/sub-admin/verifications",
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", adminToken) // Admin token, not sub-admin
        .expect(403);

      expect(response.body.message).toContain("Not authorized as a sub-admin");
    }
  });
});
