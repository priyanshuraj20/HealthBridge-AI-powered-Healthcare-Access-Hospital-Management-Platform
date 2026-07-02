import express from "express";
import { authenticate, restrict } from "../auth/verifyToken.js";
import {
  createLoanRequest,
  getMyLoans,
  getEmiEstimate,
} from "../Controllers/financialController.js";

const router = express.Router();

router.get("/estimate", getEmiEstimate);

// Authenticated routes
router.use(authenticate);
router.post("/loan-request", restrict(["patient"]), createLoanRequest);
router.get("/loans", restrict(["patient", "admin"]), getMyLoans);

export default router;
