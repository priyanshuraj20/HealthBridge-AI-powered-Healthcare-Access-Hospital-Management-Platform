import express from "express";
import { authenticate, restrict } from "../auth/verifyToken.js";
import {
  uploadReport,
  getReports,
  deleteReport,
} from "../Controllers/reportController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", restrict(["patient"]), uploadReport);
router.get("/", restrict(["patient", "doctor", "admin"]), getReports);
router.delete("/:id", restrict(["patient", "admin"]), deleteReport);

export default router;
