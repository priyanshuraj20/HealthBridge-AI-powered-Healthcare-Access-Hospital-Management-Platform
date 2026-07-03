import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import Meeting from "../models/MeetingSchema.js";
import MedicalRecord from "../models/MedicalRecordSchema.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { getOpenRouterResponse } from "./aiController.js";
import {
  sendBookingNotification,
  sendConfirmationNotification,
  sendCancellationNotification,
} from "../utils/notificationService.js";

// ─── VideoSDK helpers ───────────────────────────────────────────────────────
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET  = process.env.VIDEOSDK_SECRET || "";

/** Generate a VideoSDK participant token using JWT (no secret needed for API-key auth) */
const generateVideoSDKToken = (participantId, roomId) => {
  // VideoSDK v2 uses API-key based auth — token payload
  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: ["allow_join", "allow_mod"],
    version: 2,
    roomId,
    participantId,
  };
  // If a secret is configured, sign it; otherwise use the API key as a bearer token
  if (VIDEOSDK_SECRET) {
    return jwt.sign(payload, VIDEOSDK_SECRET, { expiresIn: "4h", algorithm: "HS256" });
  }
  // Fallback: use API key directly (VideoSDK supports this for dev)
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
    const doctor = await Doctor.findById(req.params.doctorId);
    const user = await User.findById(req.userId);

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Double booking check: same doctor, same date, same starting time
    const existingBooking = await Booking.findOne({
      doctor: doctor._id,
      appointmentDate,
      "timeSlot.day": timeSlot.day,
      "timeSlot.startingTime": timeSlot.startingTime,
      status: { $in: ["pending", "confirmed", "approved", "rescheduled"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for this doctor on this date.",
      });
    }

    const booking = new Booking({
      doctor: doctor._id,
      user: user._id,
      ticketPrice: doctor.ticketPrice,
      appointmentDate,
      timeSlot,
      symptoms: symptoms || "",
      status: "pending",
      isPaid: false,
      consultationType: consultationType || "physical",
      meetingRoom: consultationType === "video-instant" ? `healthbridge-room-${Math.floor(100000 + Math.random() * 900000)}` : "",
    });
    await booking.save();

    // Send a booking notification (pending)
    try {
      await sendBookingNotification(booking, user, doctor);
    } catch (e) {
      console.log("Email notification error:", e.message);
    }

    // Redirect to Razorpay Payment Page with prefilled query parameters
    const paymentUrl = `https://rzp.io/rzp/mnqpYBYv?email=${user.email}&phone=${user.phone || ''}&booking_id=${booking._id}&doctor_name=${encodeURIComponent(doctor.name)}&patient_name=${encodeURIComponent(user.name)}`;
    
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
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          isPaid: true,
          status: "confirmed",
        },
        { new: true }
      ).populate("user").populate("doctor");

      if (booking && booking.user && booking.doctor) {
        try {
          await sendConfirmationNotification(booking, booking.user, booking.doctor);
        } catch (e) {
          console.log("Email notification error:", e.message);
        }
      }

      res.status(200).json({ success: true, message: "Paid" });
    } else {
      await Booking.findByIdAndDelete(bookingId);
      res.status(200).json({ success: false, message: "Not paid" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Booking.find({});
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

    const appointment = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user").populate("doctor");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // If cancelled, send cancellation email
    if (status === "cancelled" && appointment.user && appointment.doctor) {
      try {
        await sendCancellationNotification(appointment, appointment.user, appointment.doctor, "doctor");
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    } else if (status === "confirmed" && appointment.user && appointment.doctor) {
      try {
        await sendConfirmationNotification(appointment, appointment.user, appointment.doctor);
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
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
    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }

    // Check if duplicate booked slot exists
    const duplicate = await Booking.findOne({
      _id: { $ne: id },
      doctor: booking.doctor,
      appointmentDate,
      "timeSlot.day": timeSlot.day,
      "timeSlot.startingTime": timeSlot.startingTime,
      status: { $in: ["pending", "confirmed", "approved", "rescheduled"] },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked for this doctor.",
      });
    }

    booking.appointmentDate = appointmentDate;
    booking.timeSlot = timeSlot;
    booking.status = "rescheduled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully.",
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }

    booking.status = "cancelled";
    await booking.save();

    const populated = await Booking.findById(id).populate("user").populate("doctor");
    if (populated && populated.user && populated.doctor) {
      try {
        await sendCancellationNotification(populated, populated.user, populated.doctor, "patient");
      } catch (e) {
        console.log("Email notification error:", e.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: booking,
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
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    booking.prescribedTests = tests;
    // Set expiry for followup: 10 days from today (since tests are being prescribed today)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);
    booking.followupExpiry = expiryDate;
    
    await booking.save();
    res.status(200).json({ success: true, message: "Lab tests prescribed successfully.", data: booking });
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
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    booking.uploadedReports.push({ name, fileUrl, date: new Date() });
    await booking.save();

    // Create the global MedicalRecord for the patient
    const newRecord = new MedicalRecord({
      patient: booking.user,
      title: name,
      recordType: "Report",
      fileUrl: fileUrl,
      uploadedBy: {
        role: req.role || "lab_tech",
        userId: req.userId || booking.user
      }
    });
    await newRecord.save();

    res.status(200).json({ success: true, message: "Report uploaded successfully.", data: booking });
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
    const originalBooking = await Booking.findById(id);
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
    const expiry = originalBooking.followupExpiry || new Date(new Date(originalBooking.appointmentDate).getTime() + 10 * 24 * 60 * 60 * 1000);
    if (today > expiry) {
      return res.status(400).json({
        success: false,
        message: "Free follow-up period has expired (within 10 days from physical consult/test prescription)."
      });
    }

    if (originalBooking.uploadedReports.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload your lab reports first before scheduling the follow-up consultation."
      });
    }

    const duplicate = await Booking.findOne({
      user: req.userId,
      doctor: originalBooking.doctor._id,
      consultationType: "video-followup",
      appointmentDate,
      "timeSlot.day": timeSlot.day,
      "timeSlot.startingTime": timeSlot.startingTime,
      status: { $ne: "cancelled" }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A video consultation slot is already scheduled or duplicate exists."
      });
    }

    const roomName = `healthbridge-followup-${originalBooking._id.toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const followupBooking = new Booking({
      doctor: originalBooking.doctor._id,
      user: originalBooking.user._id,
      ticketPrice: 0,
      appointmentDate,
      timeSlot,
      symptoms: "Free Follow-up: Lab Report Review",
      consultationType: "video-followup",
      meetingRoom: roomName,
      isPaid: true,
      status: "confirmed"
    });

    await followupBooking.save();
    res.status(200).json({ success: true, message: "Free follow-up consultation scheduled successfully.", data: followupBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Book Instant Video Consultation (₹199)
export const bookInstant = async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, message: "Symptoms description is required." });
  }

  try {
    const doctor = await Doctor.findOne({ isApproved: "approved" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "No doctors are currently available." });
    }

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = days[today.getDay()];
    
    const startingTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
    const endingTime = `${String(today.getHours() + 1).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    const roomName = `healthbridge-instant-${doctor._id.toString().slice(-6)}-${Date.now()}`;

    const booking = new Booking({
      doctor: doctor._id,
      user: req.userId,
      ticketPrice: 199,
      appointmentDate: formattedDate,
      timeSlot: {
        day: currentDay,
        startingTime,
        endingTime
      },
      symptoms: `Instant Consultation: ${symptoms}`,
      consultationType: "video-instant",
      meetingRoom: roomName,
      isPaid: true,
      status: "confirmed"
    });

    await booking.save();
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
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    booking.doctorNotes = doctorNotes;

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

    try {
      const response = await getOpenRouterResponse(messages, { type: "json_object" });
      const parsed = JSON.parse(response);
      booking.aiSummary = parsed;
    } catch (e) {
      console.error("AI Generation error:", e.message);
      booking.aiSummary = {
        symptoms: "Discussed in clinical session",
        diagnosis: "Observation noted by doctor",
        medications: "Take prescribed medication as advised",
        tests: "Review completed reports",
        followupDate: "As recommended by physical physician",
        reminders: "Drink plenty of water and rest well."
      };
    }

    booking.status = "completed";
    await booking.save();
    res.status(200).json({ success: true, message: "AI consultation summary generated and saved successfully.", data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Retrieve Single Booking Info
export const getSingleBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
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
    const booking = await Booking.findById(appointmentId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Check if meeting already exists
    let meeting = await Meeting.findOne({ appointmentId });
    if (meeting) {
      // Return existing meeting with fresh tokens
      const patientToken  = generateVideoSDKToken(`patient-${booking.user._id || booking.user}`, meeting.roomId);
      const doctorToken   = generateVideoSDKToken(`doctor-${booking.doctor._id || booking.doctor}`, meeting.roomId);
      meeting.patientToken  = patientToken;
      meeting.hospitalToken = doctorToken;
      await meeting.save();
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
      // Fallback: use the meetingRoom field from booking if VideoSDK API fails
      roomId = booking.meetingRoom || `hb-room-${appointmentId}`;
      console.error("VideoSDK room creation error (using fallback):", e.message);
    }

    const patientId      = `patient-${booking.user._id || booking.user}`;
    const doctorId       = `doctor-${booking.doctor._id || booking.doctor}`;
    const patientToken   = generateVideoSDKToken(patientId, roomId);
    const doctorToken    = generateVideoSDKToken(doctorId, roomId);

    meeting = new Meeting({
      appointmentId,
      roomId,
      patientToken,
      hospitalToken: doctorToken,
      status: "created",
    });
    await meeting.save();

    // Also update booking meetingRoom field
    booking.meetingRoom = roomId;
    await booking.save();

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
    let meeting = await Meeting.findOne({ appointmentId });

    if (!meeting) {
      // Auto-create if it doesn't exist
      const booking = await Booking.findById(appointmentId);
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

      const patientToken  = generateVideoSDKToken(`patient-${booking.user._id || booking.user}`, roomId);
      const doctorToken   = generateVideoSDKToken(`doctor-${booking.doctor._id || booking.doctor}`, roomId);

      meeting = new Meeting({
        appointmentId,
        roomId,
        patientToken,
        hospitalToken: doctorToken,
        status: "created",
      });
      await meeting.save();

      booking.meetingRoom = roomId;
      await booking.save();
    } else {
      // Refresh tokens
      const booking = await Booking.findById(appointmentId);
      if (booking) {
        meeting.patientToken  = generateVideoSDKToken(`patient-${booking.user._id || booking.user}`, meeting.roomId);
        meeting.hospitalToken = generateVideoSDKToken(`doctor-${booking.doctor._id || booking.doctor}`, meeting.roomId);
        await meeting.save();
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
    const meeting = await Meeting.findOne({ appointmentId });
    if (meeting) {
      meeting.status = "ended";
      await meeting.save();
    }

    await Booking.findByIdAndUpdate(appointmentId, { status: "completed" });

    res.status(200).json({ success: true, message: "Meeting ended and appointment marked completed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};