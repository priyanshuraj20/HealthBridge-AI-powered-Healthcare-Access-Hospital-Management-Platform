import prisma from "../utils/prismaClient.js";

export const createPrescription = async (req, res) => {
  const { user, booking, medicines, notes } = req.body;
  const doctorId = req.userId; // from auth token

  if (!user || !booking || !medicines || medicines.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Patient ID, Booking ID, and medicines list are required.",
    });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { userId: user } });
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const newPrescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId: patient.id,
        appointmentId: booking,
        medicines,
        notes: notes || "",
      },
    });

    // Optionally update booking status to 'completed'
    try {
      await prisma.appointment.update({
        where: { id: booking },
        data: { status: "completed" },
      });
    } catch (updateErr) {
      // Ignore a bad booking id so it doesn't fail the whole request
    }

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: newPrescription,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const where = {};
    if (req.role === "patient") {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.userId },
      });
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }
      where.patientId = patient.id;
    } else if (req.role === "doctor") {
      where.doctorId = req.userId;
    } else if (req.role === "admin") {
      // admin can see all
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized role" });
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { name: true, specialization: true, offlinePrice: true } },
        patient: { select: { name: true } },
      },
    });
    res.status(200).json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Authorization check
    let authorized = false;
    if (req.role === "admin") {
      authorized = true;
    } else if (prescription.doctorId === req.userId) {
      authorized = true;
    } else {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.userId },
      });
      if (patient && prescription.patientId === patient.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
