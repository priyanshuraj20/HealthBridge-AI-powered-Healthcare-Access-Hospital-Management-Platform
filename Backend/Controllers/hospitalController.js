import prisma from "../utils/prismaClient.js";
import bcrypt from "bcryptjs";

const TELEMEDICINE_SPECIALTIES = [
  "general physician", "psychiatry", "follow-up care", "pediatrics",
  "general medicine", "psychiatry/mental health", "pediatric consults"
];

const isTelemedicineEligible = (spec) =>
  TELEMEDICINE_SPECIALTIES.some(s => (spec || "").toLowerCase().includes(s));

// Get all hospitals for listing & comparison
export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { beds: true, treatmentCosts: true, doctors: { select: { id: true, name: true, specialization: true, rating: true, isTelemedicine: true, offlinePrice: true, onlinePrice: true } } }
    });
    res.status(200).json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Live beds dashboard
export const getBedsDashboard = async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      select: { id: true, name: true, beds: true }
    });
    res.status(200).json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Smart Recommendations
export const getSmartRecommendations = async (req, res) => {
  const { query, budget, insurance, specialty, maxDistance, maxWaitTime } = req.query;

  try {
    const where = {};

    if (maxDistance) where.distance = { lte: parseFloat(maxDistance) };
    if (maxWaitTime) where.waitingTime = { lte: parseInt(maxWaitTime) };

    let hospitals = await prisma.hospital.findMany({
      where,
      include: { beds: true, treatmentCosts: true }
    });

    // Filter specialty (comma-separated string)
    if (specialty) {
      hospitals = hospitals.filter(h =>
        (h.specialties || "").toLowerCase().includes(specialty.toLowerCase())
      );
    }
    // Filter insurance
    if (insurance) {
      hospitals = hospitals.filter(h =>
        (h.supportedInsurances || "").toLowerCase().includes(insurance.toLowerCase())
      );
    }
    // Filter query
    if (query && query.trim() !== "") {
      const q = query.trim().toLowerCase();
      hospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(q) ||
        (h.location || "").toLowerCase().includes(q) ||
        (h.specialties || "").toLowerCase().includes(q) ||
        h.treatmentCosts.some(tc => tc.treatmentName.toLowerCase().includes(q))
      );
    }
    // Filter by budget
    if (budget && budget !== "") {
      const maxBudget = parseFloat(budget);
      hospitals = hospitals.filter(h => h.treatmentCosts.some(tc => tc.cost <= maxBudget));
    }

    hospitals.sort((a, b) => b.rating - a.rating || a.distance - b.distance);

    // Doctor Recommendations
    let doctors = [];
    if (specialty || (query && query.trim() !== "")) {
      const searchTerm = specialty || query.trim();
      doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { specialization: { contains: searchTerm } },
            { name: { contains: searchTerm } }
          ]
        },
        select: { id: true, name: true, specialization: true, rating: true, offlinePrice: true, onlinePrice: true, isTelemedicine: true, hospitalId: true }
      });
    } else {
      doctors = await prisma.doctor.findMany({
        take: 4,
        orderBy: { rating: "desc" },
        select: { id: true, name: true, specialization: true, rating: true, offlinePrice: true, onlinePrice: true, isTelemedicine: true, hospitalId: true }
      });
    }

    res.status(200).json({ success: true, data: { hospitals, doctors } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create Hospital Branch
export const registerHospitalBranch = async (req, res) => {
  const { name, location, address, city, phone, licenseNumber, totalBeds, totalIcuBeds, specialties } = req.body;
  const orgId = req.userId;

  try {
    const org = await prisma.organization.findUnique({ where: { userId: orgId } });
    if (!org) return res.status(404).json({ success: false, message: "Organization not found" });

    const branch = await prisma.hospital.create({
      data: {
        organizationId: org.id,
        name,
        location: location || "Care City",
        address,
        city,
        phone,
        licenseNumber,
        specialties: Array.isArray(specialties) ? specialties.join(",") : (specialties || ""),
        supportedInsurances: "",
        beds: {
          create: [
            { type: "icu", total: totalIcuBeds || 10, available: totalIcuBeds || 10 },
            { type: "general", total: totalBeds || 50, available: totalBeds || 50 },
            { type: "private", total: 20, available: 20 },
            { type: "emergency", total: 10, available: 10 }
          ]
        }
      },
      include: { beds: true }
    });

    res.status(201).json({ success: true, message: "Hospital branch registered successfully", data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Onboard Doctor
export const onboardDoctor = async (req, res) => {
  const { name, email, password, ticketPrice, specialization, department, isTelemedicine } = req.body;
  const branchId = req.params.id;

  try {
    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "A doctor with this email is already registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const telemedicineAllowed = isTelemedicineEligible(specialization) && isTelemedicine;

    const doctor = await prisma.doctor.create({
      data: {
        hospitalId: branchId,
        name,
        email,
        passwordHash: hashPassword,
        offlinePrice: ticketPrice || 500,
        specialization: specialization || "",
        qualification: department || "",
        isTelemedicine: telemedicineAllowed
      }
    });

    const { passwordHash, ...rest } = doctor;
    res.status(201).json({ success: true, message: "Doctor onboarded successfully", data: rest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Onboard Staff
export const onboardStaff = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!["receptionist", "lab_tech"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid staff role selected" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: { email, passwordHash: hashPassword, role }
    });

    res.status(201).json({ success: true, message: "Staff onboarded successfully", data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Beds
export const updateBeds = async (req, res) => {
  const { availableBeds, availableIcuBeds } = req.body;
  const branchId = req.params.id;

  try {
    if (availableBeds !== undefined) {
      await prisma.bed.updateMany({ where: { hospitalId: branchId, type: "general" }, data: { available: availableBeds } });
    }
    if (availableIcuBeds !== undefined) {
      await prisma.bed.updateMany({ where: { hospitalId: branchId, type: "icu" }, data: { available: availableIcuBeds } });
    }
    const beds = await prisma.bed.findMany({ where: { hospitalId: branchId } });
    res.status(200).json({ success: true, message: "Beds updated successfully", data: beds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Hospital Queue
export const getHospitalQueue = async (req, res) => {
  const branchId = req.params.id;
  try {
    const appointments = await prisma.appointment.findMany({
      where: { hospitalId: branchId, status: "upcoming" },
      include: { patient: true, doctor: true },
      orderBy: { dateTime: "asc" }
    });
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check-in patient
export const checkInPatient = async (req, res) => {
  const appointmentId = req.params.bookingId;
  const { status } = req.body;

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status || "completed" }
    });
    res.status(200).json({ success: true, message: `Status updated to ${appointment.status}`, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Treatment Costs
export const updateTreatments = async (req, res) => {
  const { treatmentCosts } = req.body;
  const branchId = req.params.id;

  try {
    // Delete existing and re-insert
    await prisma.treatmentCost.deleteMany({ where: { hospitalId: branchId } });
    if (Array.isArray(treatmentCosts) && treatmentCosts.length > 0) {
      await prisma.treatmentCost.createMany({
        data: treatmentCosts.map(tc => ({
          hospitalId: branchId,
          treatmentName: tc.treatmentName,
          cost: tc.cost
        }))
      });
    }
    const costs = await prisma.treatmentCost.findMany({ where: { hospitalId: branchId } });
    res.status(200).json({ success: true, message: "Treatment costs updated successfully", data: costs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Hospital
export const getSingleHospital = async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.params.id },
      include: { beds: true, treatmentCosts: true, doctors: { select: { id: true, name: true, specialization: true, rating: true, isTelemedicine: true, offlinePrice: true, onlinePrice: true, photoUrl: true } } }
    });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found" });
    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get hospitals under this org
export const getMyHospitals = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { userId: req.userId },
      include: { hospitals: { include: { beds: true, treatmentCosts: true, doctors: true } } }
    });
    if (!org) return res.status(404).json({ success: false, message: "Organization not found" });
    res.status(200).json({ success: true, data: org.hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
