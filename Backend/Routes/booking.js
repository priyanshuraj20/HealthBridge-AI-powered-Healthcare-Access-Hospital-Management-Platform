import express from "express";
import { authenticate, restrict } from "../auth/verifyToken.js";
import {
  getAllAppointments,
  getCheckOutSession,
  verifyBooking,
  updateStatus,
  rescheduleBooking,
  cancelBooking,
  prescribeTests,
  uploadReports,
  scheduleFollowup,
  bookInstant,
  generateAISummary,
  getSingleBooking,
} from "../Controllers/BookingController.js";

const router = express.Router();

router.post(
  "/checkout-session/:doctorId",
  authenticate,
  restrict(["patient"]),
  getCheckOutSession
);
router.post("/verify", verifyBooking);
router.get("/allAppointments", getAllAppointments);
router.put("/updateStatus/:id", updateStatus);
router.put("/reschedule/:id", authenticate, rescheduleBooking);
router.put("/cancel/:id", authenticate, cancelBooking);

// Telemedicine routes
router.post("/prescribe-tests/:id", authenticate, restrict(["doctor"]), prescribeTests);
router.post("/upload-reports/:id", authenticate, restrict(["patient"]), uploadReports);
router.post("/schedule-followup/:id", authenticate, restrict(["patient"]), scheduleFollowup);
router.post("/book-instant", authenticate, restrict(["patient"]), bookInstant);
router.post("/ai-summary/:id", authenticate, restrict(["doctor"]), generateAISummary);
router.get("/single/:id", authenticate, getSingleBooking);

export default router;