import express from "express";
import { authenticate } from "../auth/verifyToken.js";
import {
  checkSymptoms,
  getAppointmentSummary,
  getReportSummary,
  getPrescriptionExplanation,
  chatAssistant,
  financialCounsel,
  insuranceGuide,
  explainCost,
  hospitalRecommend,
  checkDrugInteractions,
  scanPrescription,
} from "../Controllers/aiController.js";

const router = express.Router();

router.post("/symptom-checker", checkSymptoms);
router.post("/chat-assistant", chatAssistant);
router.post("/drug-interaction", checkDrugInteractions);
router.post("/scan-prescription", scanPrescription);

// Authenticated AI routes
router.post("/appointment-summary", authenticate, getAppointmentSummary);
router.post("/report-summary", authenticate, getReportSummary);
router.post("/prescription-explanation", authenticate, getPrescriptionExplanation);
router.post("/financial-counsel", authenticate, financialCounsel);
router.post("/insurance-guide", authenticate, insuranceGuide);
router.post("/cost-explainer", authenticate, explainCost);
router.post("/hospital-recommend", authenticate, hospitalRecommend);

export default router;
