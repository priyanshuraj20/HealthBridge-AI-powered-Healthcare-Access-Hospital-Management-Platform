import Hospital from "../models/HospitalSchema.js";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import bcrypt from "bcryptjs";

// Get all hospitals for listing & comparison
export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({});
    res.status(200).json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Live beds dashboard query
export const getBedsDashboard = async (req, res) => {
  try {
    const bedsData = await Hospital.find({}, { name: 1, beds: 1 });
    res.status(200).json({ success: true, data: bedsData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Smart Recommendations for Hospitals & Doctors
export const getSmartRecommendations = async (req, res) => {
  const { query, budget, insurance, specialty, maxDistance, maxWaitTime } = req.query;

  try {
    let hospitalFilter = {};

    if (specialty) {
      hospitalFilter.specialties = { $in: [new RegExp(specialty, "i")] };
    }
    if (insurance) {
      hospitalFilter.supportedInsurances = { $in: [new RegExp(insurance, "i")] };
    }
    if (maxDistance) {
      hospitalFilter.distance = { $lte: parseFloat(maxDistance) };
    }
    if (maxWaitTime) {
      hospitalFilter.waitingTime = { $lte: parseInt(maxWaitTime) };
    }
    if (query && query.trim() !== "") {
      const reg = new RegExp(query.trim(), "i");
      hospitalFilter.$or = [
        { name: reg },
        { location: reg },
        { specialties: { $in: [reg] } },
        { "treatmentCosts.treatmentName": reg }
      ];
    }

    let hospitals = await Hospital.find(hospitalFilter);

    // Filter by budget if treatment costs are specified
    if (budget && budget !== "") {
      const maxBudget = parseFloat(budget);
      hospitals = hospitals.filter((h) => {
        const withinBudget = h.treatmentCosts.some((tc) => tc.cost <= maxBudget);
        return withinBudget;
      });
    }

    // Sort by rating desc, distance asc
    hospitals.sort((a, b) => b.rating - a.rating || a.distance - b.distance);

    // Doctor Recommendations
    let doctors = [];
    if (specialty) {
      doctors = await Doctor.find({
        $or: [
          { specialization: new RegExp(specialty, "i") },
          { department: new RegExp(specialty, "i") },
        ],
      }).select("-password");
    } else if (query && query.trim() !== "") {
      const reg = new RegExp(query.trim(), "i");
      doctors = await Doctor.find({
        $or: [
          { name: reg },
          { specialization: reg },
          { department: reg }
        ]
      }).select("-password");
    } else {
      doctors = await Doctor.find({})
        .sort({ averageRating: -1 })
        .limit(4)
        .select("-password");
    }

    res.status(200).json({
      success: true,
      data: {
        hospitals,
        doctors,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new Hospital Branch (under Organization)
export const registerHospitalBranch = async (req, res) => {
  const { name, location, address, city, phone, licenseNumber, totalBeds, totalIcuBeds, specialties } = req.body;
  const orgId = req.userId;

  try {
    const existing = await Hospital.findOne({ licenseNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: "A branch with this license already exists" });
    }

    const branch = new Hospital({
      organization: orgId,
      name,
      location,
      address,
      city,
      phone,
      licenseNumber,
      beds: {
        icu: { total: totalIcuBeds || 10, available: totalIcuBeds || 10 },
        general: { total: totalBeds || 50, available: totalBeds || 50 }
      },
      specialties: specialties || []
    });

    await branch.save();
    res.status(201).json({ success: true, message: "Hospital branch registered successfully", data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Onboard Doctor to Hospital Branch
export const onboardDoctor = async (req, res) => {
  const { name, email, password, ticketPrice, specialization, department } = req.body;
  const branchId = req.params.id;

  try {
    const existing = await Doctor.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "A doctor with this email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const TELEMEDICINE_SPECIALTIES = [
      "General Physician", "Psychiatry", "Follow-up Care", "Pediatrics", 
      "General Medicine", "Psychiatry/Mental Health", "Pediatric Consults"
    ];
    const acceptsTelemedicine = TELEMEDICINE_SPECIALTIES.some(s => 
      (specialization || "").toLowerCase().includes(s.toLowerCase())
    );

    const doctor = new Doctor({
      hospital: branchId,
      name,
      email,
      password: hashPassword,
      ticketPrice: ticketPrice || 500,
      specialization,
      department,
      isTelemedicine: acceptsTelemedicine && req.body.isTelemedicine ? true : false
    });

    await doctor.save();
    res.status(201).json({ success: true, message: "Doctor onboarded successfully", data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Onboard Receptionist or Lab Technician to Branch
export const onboardStaff = async (req, res) => {
  const { name, email, password, role } = req.body;
  const branchId = req.params.id;

  if (!["receptionist", "lab_tech"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid staff role selected" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const staff = new User({
      name,
      email,
      password: hashPassword,
      role,
      hospital: branchId
    });

    await staff.save();
    res.status(201).json({ success: true, message: "Staff onboarded successfully", data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Live beds update endpoint
export const updateBeds = async (req, res) => {
  const { availableBeds, availableIcuBeds } = req.body;
  const branchId = req.params.id;

  try {
    const branch = await Hospital.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    if (availableBeds !== undefined) branch.beds.general.available = availableBeds;
    if (availableIcuBeds !== undefined) branch.beds.icu.available = availableIcuBeds;

    await branch.save();
    res.status(200).json({ success: true, message: "Beds updated successfully", data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Live queue query for reception & doctors
export const getHospitalQueue = async (req, res) => {
  const branchId = req.params.id;
  try {
    const doctors = await Doctor.find({ hospital: branchId });
    const doctorIds = doctors.map((d) => d._id);

    const bookings = await Booking.find({ doctor: { $in: doctorIds } })
      .populate("user", "name email phone gender")
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: 1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reception check-in status update
export const checkInPatient = async (req, res) => {
  const bookingId = req.params.bookingId;
  const { status } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = status || "confirmed";
    await booking.save();

    res.status(200).json({ success: true, message: `Patient check-in status updated to ${booking.status}`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Live treatment costs update endpoint
export const updateTreatments = async (req, res) => {
  const { treatmentCosts } = req.body;
  const branchId = req.params.id;

  try {
    const branch = await Hospital.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    if (treatmentCosts !== undefined) {
      branch.treatmentCosts = treatmentCosts;
    }

    await branch.save();
    res.status(200).json({ success: true, message: "Treatment costs updated successfully", data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single hospital by ID
export const getSingleHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
