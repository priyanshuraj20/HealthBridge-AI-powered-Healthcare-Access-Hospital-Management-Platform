import express from "express";
import {
  checkSchemeEligibility,
  estimateCoverage,
  getSupportedInsurances,
  predictTreatmentCosts,
} from "../Controllers/affordabilityController.js";

const router = express.Router();

router.get("/insurances", getSupportedInsurances);
router.post("/eligibility", checkSchemeEligibility);
router.post("/coverage-estimator", estimateCoverage);
router.post("/predict-costs", predictTreatmentCosts);

export default router;
