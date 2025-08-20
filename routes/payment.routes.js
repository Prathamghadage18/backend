import express from "express";
import { getConsultantPayments } from "../controllers/payment.controller.js";
import { protect, consultant } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, consultant);

router.get("/", getConsultantPayments);

export default router;
