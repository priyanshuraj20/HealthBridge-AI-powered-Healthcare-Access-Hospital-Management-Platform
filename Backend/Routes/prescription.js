import express from "express";
import { authenticate, restrict } from "../auth/verifyToken.js";
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
} from "../Controllers/prescriptionController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", restrict(["doctor"]), createPrescription);
router.get("/", restrict(["patient", "doctor", "admin"]), getPrescriptions);
router.get("/:id", restrict(["patient", "doctor", "admin"]), getPrescriptionById);

export default router;
