import prisma from "../utils/prismaClient.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { getOpenRouterResponse } from "./aiController.js";
import {
  sendBookingNotification,
  sendConfirmationNotification,
  sendCancellationNotification,
} from "../utils/notificationService.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Build a notification-friendly "user" object ({ name, email }) from an Appointment
// that has its patient (and the patient's login user) included.
const patientContact = (patient) => ({
  name: patient?.name || "Patient",
  email: patient?.user?.email || "",
  phone: patient?.phone || "",
});

const appointmentInclude = {
  patient: { include: { user: true } },
  doctor: true,
};

// ─── VideoSDK helpers ───────────────────────────────────────────────────────
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET  = process.env.VIDEOSDK_SECRET || "";

/** Generate a VideoSDK participant token using JWT (no secret needed for API-key auth) */
const generateVideoSDKToken = (participantId, roomId) => {
  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: ["allow_join", "allow_mod"],
    version: 2,
    roomId,
    participantId,
    roles: ["rtc"],
  };
  if (VIDEOSDK_SECRET) {
    return jwt.sign(payload, VIDEOSDK_SECRET, { expiresIn: "4h", algorithm: "HS256" });
  }
  return VIDEOSDK_API_KEY;
};

/** Create a VideoSDK room via REST API */
const createVideoSDKRoom = async () => {
  const token = generateVideoSDKToken("server", "");
  const res = await fetch("https://api.videosdk.live/v2/rooms", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`VideoSDK room creation failed: ${err}`);
  }
  const data = await res.json();
  return data.roomId;
};

export const getCheckOutSession = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { appointmentDate, timeSlot, symptoms, consultationType } = req.body;

  if (!appointmentDate || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: "Appointment date and time slot are required.",
    });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.doctorId } });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { patient: true } });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    if (!user || !user.patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    // Double booking check: same doctor, same date, same starting time (timeSlot is JSON)
    const sameDayBookings = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate,
        status: { in: ["pending", "confirmed", "approved", "rescheduled"] },
      },
    });
    const existingBooking = sameDayBookings.find(
      (b) => b.timeSlot?.day === timeSlot.day && b.timeSlot?.startingTime === timeSlot.startingTime
    );

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for this doctor on this date.",
      });
    }

    const isVideo = (consultationType || "").startsWith("video");
    const booking = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: user.patient.id,
        hospitalId: doctor.hospitalId,
        price: isVideo ? (doctor.onlinePrice || doctor.offlinePrice) : doctor.offlinePrice,
        appointmentDate,
        timeSlot,
        symptoms: symptoms || "",
        status: "pending",
        isPaid: false,
        paymentStatus: "pending",
        mode: isVideo ? "online" : "offline",
        consultationType: consultationType || "physical",
        meetingRoom: consultationType === "video-instant" ? `healthbridge-room-${Math.floor(100000 + Math.random() * 900000)}` : "",
      },
    });

    // Send a booking notification (pending)
    try {
      await sendBookingNotification(booking, patientContact(user.patient), doctor);
    } catch (e) {
      console.log("Email notification error:", e.message);
    }

    // Redirect to Razorpay Payment Page with prefilled query parameters
    const paymentUrl = `https://rzp.io/rzp/mnqpYBYv?email=${user.email}&phone=${user.patient.phone || ''}&booking_id=${booking.id}&doctor_name=${encodeURIComponent(doctor.name)}&patient_name=${encodeURIComponent(user.patient.name)}`;

    res.status(200).json({
      success: true,
      message: "Booking initiated, redirecting to secure payment page",
      session_url: paymentUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Payment initiation failed: " + err.message,
    });
  }
};

export const verifyBooking = async (req, res) => {
  const { bookingId, success } = req.body;
  try {
    if (success === "true") {
      const booking = await prisma.appointment.update({
        where: { id: bookingId },
        data: { isPaid: true, status: "confirmed", paymentStatus: "paid" },
        include: appointmentInclude,
      });

      if (booking && booking.patient && booking.doctor) {
        try {
          await sendConfirmationNotification(booking, patientContact(booking.patient), booking.doctor);
        } catch (e) {
          console.log("Email notification error:", e.message);
        }
      }

      res.status(200).json({ success: true, message: "Paid" });
    } else {
      await prisma.appointment.delete({ where: { id: bookingId } });
      res.status(200).json({ success: false, message: "Not paid" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({ include: appointmentInclude });
    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "no-show",
      "rescheduled",
      "approved",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });

    if (status === "cancelled" && appointment.patient && appointment.doctor) {
      try {
        await sendCancellationNotification(appointment, patientContact(appointment.patient), appointment.doctor, "doctor");
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    } else if (status === "confirmed" && appointment.patient && appointment.doctor) {
      try {
        await sendConfirmationNotification(appointment, patientContact(appointment.patient), appointment.doctor);
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Appointment not found" });
    }
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const rescheduleBooking = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, timeSlot } = req.body;

  if (!appointmentDate || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: "Rescheduling requires appointment date and time slot.",
    });
  }

  try {
    const booking = await prisma.appointment.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Check if duplicate booked slot exists
    const candidates = await prisma.appointment.findMany({
      where: {
        id: { not: id },
        doctorId: booking.doctorId,
        appointmentDate,
        status: { in: ["pending", "confirmed", "approved", "rescheduled"] },
      },
    });
    const duplicate = candidates.find(
      (b) => b.timeSlot?.day === timeSlot.day && b.timeSlot?.startingTime === timeSlot.startingTime
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for this doctor.",
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { appointmentDate, timeSlot, status: "rescheduled" },
    });

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.appointment.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
      include: appointmentInclude,
    });

    if (updated && updated.patient && updated.doctor) {
      try {
        await sendCancellationNotification(updated, patientContact(updated.patient), updated.doctor, "patient");
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Telemedicine Actions

// 1. Prescribe Lab Tests
export const prescribeTests = async (req, res) => {
  const { id } = req.params;
  const { tests } = req.body;

  if (!tests || !Array.isArray(tests)) {
    return res.status(400).json({ success: false, message: "Tests list is required as an array." });
  }

  try {
    const booking = await prisma.appointment.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Set expiry for followup: 10 days from today
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { prescribedTests: tests, followupExpiry: expiryDate },
    });
    res.status(200).json({ success: true, message: "Lab tests prescribed successfully.", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Upload Lab Reports
export const uploadReports = async (req, res) => {
  const { id } = req.params;
  const { name, fileUrl } = req.body;

  if (!name || !fileUrl) {
    return res.status(400).json({ success: false, message: "Report name and file URL are required." });
  }

  try {
    const booking = await prisma.appointment.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    const uploadedReports = Array.isArray(booking.uploadedReports) ? booking.uploadedReports : [];
    uploadedReports.push({ name, fileUrl, date: new Date().toISOString() });

    const updated = await prisma.appointment.update({
      where: { id },
      data: { uploadedReports },
    });

    // Also create a global medical report record for the patient
    try {
      await prisma.report.create({
        data: {
          patientId: booking.patientId,
          appointmentId: booking.id,
          title: name,
          fileUrl,
        },
      });
    } catch (e) {
      console.log("Report record creation error:", e.message);
    }

    res.status(200).json({ success: true, message: "Report uploaded successfully.", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Schedule Free Follow-up Video Call
export const scheduleFollowup = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, timeSlot } = req.body;

  if (!appointmentDate || !timeSlot) {
    return res.status(400).json({ success: false, message: "Date and time slot are required." });
  }

  try {
    const originalBooking = await prisma.appointment.findUnique({ where: { id } });
    if (!originalBooking) {
      return res.status(404).json({ success: false, message: "Original physical appointment not found." });
    }

    if (originalBooking.consultationType !== "physical" || originalBooking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Free follow-up is only available for completed physical consultations."
      });
    }

    const today = new Date();
    const baseDate = originalBooking.appointmentDate ? new Date(originalBooking.appointmentDate) : today;
    const expiry = originalBooking.followupExpiry || new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    if (today > expiry) {
      return res.status(400).json({
        success: false,
        message: "Free follow-up period has expired (within 10 days from physical consult/test prescription)."
      });
    }

    const uploadedReports = Array.isArray(originalBooking.uploadedReports) ? originalBooking.uploadedReports : [];
    if (uploadedReports.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload your lab reports first before scheduling the follow-up consultation."
      });
    }

    const candidates = await prisma.appointment.findMany({
      where: {
        patientId: originalBooking.patientId,
        doctorId: originalBooking.doctorId,
        consultationType: "video-followup",
        appointmentDate,
        status: { not: "cancelled" },
      },
    });
    const duplicate = candidates.find(
      (b) => b.timeSlot?.day === timeSlot.day && b.timeSlot?.startingTime === timeSlot.startingTime
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A video consultation slot is already scheduled or duplicate exists."
      });
    }

    const roomName = `healthbridge-followup-${originalBooking.id.slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const followupBooking = await prisma.appointment.create({
      data: {
        doctorId: originalBooking.doctorId,
        patientId: originalBooking.patientId,
        hospitalId: originalBooking.hospitalId,
        price: 0,
        appointmentDate,
        timeSlot,
        symptoms: "Free Follow-up: Lab Report Review",
        consultationType: "video-followup",
        mode: "online",
        meetingRoom: roomName,
        isPaid: true,
        paymentStatus: "paid",
        status: "confirmed",
      },
    });

    res.status(200).json({ success: true, message: "Free follow-up consultation scheduled successfully.", data: followupBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const bookInstant = async (req, res) => {
  const { symptoms, specialty } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, message: "Symptoms description is required." });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.userId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    let doctor = null;
    if (specialty) {
      doctor = await prisma.doctor.findFirst({
        where: {
          isApproved: "approved",
          isTelemedicine: true,
          specialization: { contains: specialty, mode: "insensitive" }
        }
      });
    }

    if (!doctor) {
      doctor = await prisma.doctor.findFirst({
        where: { isApproved: "approved", isTelemedicine: true }
      });
    }

    if (!doctor) {
      doctor = await prisma.doctor.findFirst({
        where: { isApproved: "approved" }
      });
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: "No doctors are currently available." });
    }

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = days[today.getDay()];

    const startingTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
    const endingTime = `${String(today.getHours() + 1).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    const roomName = `healthbridge-instant-${doctor.id.slice(-6)}-${Date.now()}`;

    const booking = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        hospitalId: doctor.hospitalId,
        price: 199,
        appointmentDate: formattedDate,
        timeSlot: { day: currentDay, startingTime, endingTime },
        symptoms: `Instant Consultation: ${symptoms}`,
        consultationType: "video-instant",
        mode: "online",
        meetingRoom: roomName,
        isPaid: true,
        paymentStatus: "paid",
        status: "confirmed",
      },
    });

    res.status(200).json({ success: true, message: "Instant video consultation booked successfully.", data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Generate AI Consultation Summary
export const generateAISummary = async (req, res) => {
  const { id } = req.params;
  const { doctorNotes } = req.body;

  if (!doctorNotes) {
    return res.status(400).json({ success: false, message: "Doctor notes are required to generate a summary." });
  }

  try {
    const booking = await prisma.appointment.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    const messages = [
      {
        role: "system",
        content: `You are a clinical coordinator. Analyze the doctor's consultation notes and extract key medical insights. Returns ONLY a valid JSON object with the following fields: symptoms, diagnosis, medications, tests, followupDate, and reminders. Do not include markdown block ticks or other formatting.
Structure:
{
  "symptoms": "extracted symptoms",
  "diagnosis": "extracted diagnosis",
  "medications": "prescribed medications and dosages",
  "tests": "lab tests ordered if any",
  "followupDate": "suggested follow-up timeline",
  "reminders": "preventative health reminders or patient instructions"
}`
      },
      {
        role: "user",
        content: `Notes: ${doctorNotes}`
      }
    ];

    let aiSummary;
    try {
      const response = await getOpenRouterResponse(messages, { type: "json_object" });
      aiSummary = JSON.parse(response);
    } catch (e) {
      console.error("AI Generation error:", e.message);
      aiSummary = {
        symptoms: "Discussed in clinical session",
        diagnosis: "Observation noted by doctor",
        medications: "Take prescribed medication as advised",
        tests: "Review completed reports",
        followupDate: "As recommended by physical physician",
        reminders: "Drink plenty of water and rest well."
      };
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { doctorNotes, aiSummary, status: "completed" },
    });
    res.status(200).json({ success: true, message: "AI consultation summary generated and saved successfully.", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Retrieve Single Booking Info
export const getSingleBooking = async (req, res) => {
  try {
    const booking = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: appointmentInclude,
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VideoSDK Meeting Controllers ────────────────────────────────────────────

// 7. Create VideoSDK Meeting for an appointment
export const createMeeting = async (req, res) => {
  const { appointmentId } = req.body;
  if (!appointmentId) {
    return res.status(400).json({ success: false, message: "appointmentId is required." });
  }

  try {
    const booking = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Check if meeting already exists
    let meeting = await prisma.meeting.findUnique({ where: { appointmentId } });
    if (meeting) {
      const patientToken  = generateVideoSDKToken(`patient-${booking.patientId}`, meeting.roomId);
      const doctorToken   = generateVideoSDKToken(`doctor-${booking.doctorId}`, meeting.roomId);
      meeting = await prisma.meeting.update({
        where: { appointmentId },
        data: { patientToken, hospitalToken: doctorToken },
      });
      return res.status(200).json({
        success: true,
        message: "Meeting already exists.",
        data: meeting,
      });
    }

    // Create a new VideoSDK room
    let roomId;
    try {
      roomId = await createVideoSDKRoom();
    } catch (e) {
      roomId = booking.meetingRoom || `hb-room-${appointmentId}`;
      console.error("VideoSDK room creation error (using fallback):", e.message);
    }

    const patientToken   = generateVideoSDKToken(`patient-${booking.patientId}`, roomId);
    const doctorToken    = generateVideoSDKToken(`doctor-${booking.doctorId}`, roomId);

    meeting = await prisma.meeting.create({
      data: {
        appointmentId,
        roomId,
        patientToken,
        hospitalToken: doctorToken,
        status: "created",
      },
    });

    // Also update booking meetingRoom field
    await prisma.appointment.update({ where: { id: appointmentId }, data: { meetingRoom: roomId } });

    res.status(201).json({
      success: true,
      message: "VideoSDK meeting created successfully.",
      data: meeting,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Get Meeting details + fresh tokens for an appointment
export const getMeetingByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    let meeting = await prisma.meeting.findUnique({ where: { appointmentId } });

    if (!meeting) {
      // Auto-create if it doesn't exist
      const booking = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!booking) {
        return res.status(404).json({ success: false, message: "Appointment not found." });
      }

      let roomId;
      try {
        roomId = await createVideoSDKRoom();
      } catch (e) {
        roomId = booking.meetingRoom || `hb-room-${appointmentId}`;
        console.error("VideoSDK room creation error (using fallback):", e.message);
      }

      const patientToken  = generateVideoSDKToken(`patient-${booking.patientId}`, roomId);
      const doctorToken   = generateVideoSDKToken(`doctor-${booking.doctorId}`, roomId);

      meeting = await prisma.meeting.create({
        data: { appointmentId, roomId, patientToken, hospitalToken: doctorToken, status: "created" },
      });

      await prisma.appointment.update({ where: { id: appointmentId }, data: { meetingRoom: roomId } });
    } else {
      // Refresh tokens
      const booking = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (booking) {
        meeting = await prisma.meeting.update({
          where: { appointmentId },
          data: {
            patientToken: generateVideoSDKToken(`patient-${booking.patientId}`, meeting.roomId),
            hospitalToken: generateVideoSDKToken(`doctor-${booking.doctorId}`, meeting.roomId),
          },
        });
      }
    }

    res.status(200).json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. End a VideoSDK meeting and mark appointment completed
export const endMeeting = async (req, res) => {
  const { appointmentId } = req.body;
  try {
    const meeting = await prisma.meeting.findUnique({ where: { appointmentId } });
    if (meeting) {
      await prisma.meeting.update({ where: { appointmentId }, data: { status: "ended" } });
    }

    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "completed" } });

    res.status(200).json({ success: true, message: "Meeting ended and appointment marked completed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Create an instant/emergency video consult match
export const createInstantBooking = async (req, res) => {
  const { specialty } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { patient: true } });
    if (!user || !user.patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    // Find the first doctor offering telemedicine in this specialty
    const targetSpecialization = specialty || "General Physician";
    const doctor = await prisma.doctor.findFirst({
      where: {
        isTelemedicine: true,
        specialization: { contains: targetSpecialization, mode: 'insensitive' }
      }
    });

    if (!doctor) {
      // Fallback: find any telemedicine doctor
      const fallbackDoctor = await prisma.doctor.findFirst({ where: { isTelemedicine: true } });
      if (!fallbackDoctor) {
        return res.status(404).json({ success: false, message: "No telemedicine doctors are online/available right now." });
      }
      return createBookingWithDoctor(fallbackDoctor, user.patient, res);
    }

    return createBookingWithDoctor(doctor, user.patient, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBookingWithDoctor = async (doctor, patient, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const timeSlot = { day: "today", startingTime: "12:00", endingTime: "12:30" };
  const roomId = `healthbridge-room-${Math.floor(100000 + Math.random() * 900000)}`;

  const booking = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      hospitalId: doctor.hospitalId,
      price: doctor.onlinePrice || 199,
      appointmentDate: todayStr,
      timeSlot,
      symptoms: "Instant Emergency consultation",
      status: "confirmed", // auto-confirm for instant match
      isPaid: true,        // auto-pay/free triage
      paymentStatus: "paid",
      mode: "online",
      consultationType: "video-instant",
      meetingRoom: roomId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Instant consultation matched successfully",
    data: booking
  });
};
