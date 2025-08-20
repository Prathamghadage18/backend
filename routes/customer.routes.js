import express from "express";
import { createCustomer, getAllCustomers } from "../controllers/customer.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", upload.array("supportDocs"), createCustomer);
router.get("/", getAllCustomers);
export default router;
