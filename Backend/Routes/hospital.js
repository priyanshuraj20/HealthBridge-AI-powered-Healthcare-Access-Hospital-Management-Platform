import express from "express";
import {
  getAllHospitals,
  getBedsDashboard,
  getSmartRecommendations,
  registerHospitalBranch,
  onboardDoctor,
  onboardStaff,
  updateBeds,
  getHospitalQueue,
  checkInPatient
} from "../Controllers/hospitalController.js";
import { authenticate, restrict } from "../auth/verifyToken.js";

const router = express.Router();

// Public Directories
router.get("/", getAllHospitals);
router.get("/beds", getBedsDashboard);
router.get("/recommendations", getSmartRecommendations);

// Branch Management (Corporate Admin only)
router.post("/register-branch", authenticate, restrict(["org_admin"]), registerHospitalBranch);
router.post("/:id/doctors", authenticate, restrict(["org_admin"]), onboardDoctor);
router.post("/:id/staff", authenticate, restrict(["org_admin"]), onboardStaff);

// Operational HMS (Staff/Reception/Doctors)
router.put("/:id/beds", authenticate, restrict(["org_admin", "receptionist"]), updateBeds);
router.get("/:id/queue", authenticate, restrict(["org_admin", "receptionist", "doctor"]), getHospitalQueue);
router.put("/bookings/:bookingId/checkin", authenticate, restrict(["receptionist"]), checkInPatient);

export default router;
