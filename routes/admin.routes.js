import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getConsultants,
  updateConsultantStatus,
  getCustomers,
  getTransactions,
  getVerifications,
  updateVerificationStatus,
  getAnalytics,
  getConsultantsByStatus,
  deleteConsultant,
  deleteCustomer,
  updateCustomerStatus,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply authentication and admin middleware to all routes
// router.use(protect);
// router.use(admin);

// /api/admin
// Consultant management
router.get("/consultants", getConsultants);
router.get("/verified-consultant", getConsultantsByStatus);
router.put("/consultants/:id/status", updateConsultantStatus);
router.delete("/consultants/:id", deleteConsultant);  

// Customer management
router.get("/customers", getCustomers);
router.delete("/customers/:id", deleteCustomer); 
router.put("/customer/status",  updateCustomerStatus);

// Transaction management
router.get("/transactions", getTransactions);

// Verification management
router.get("/verifications", getVerifications);
router.put("/verifications/:id/status", updateVerificationStatus);

// Analytics
router.get("/analytics", getAnalytics);

export default router;
