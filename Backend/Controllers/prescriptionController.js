import Prescription from "../models/PrescriptionSchema.js";
import Booking from "../models/BookingSchema.js";

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
    const newPrescription = new Prescription({
      doctor: doctorId,
      user,
      booking,
      medicines,
      notes: notes || "",
    });

    await newPrescription.save();

    // Optionally update booking status to 'completed'
    await Booking.findByIdAndUpdate(booking, { status: "completed" });

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
    let query = {};
    if (req.role === "patient") {
      query.user = req.userId;
    } else if (req.role === "doctor") {
      query.doctor = req.userId;
    } else if (req.role === "admin") {
      // admin can see all
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized role" });
    }

    const prescriptions = await Prescription.find(query).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Authorization check
    if (
      req.role !== "admin" &&
      prescription.user._id.toString() !== req.userId &&
      prescription.doctor._id.toString() !== req.userId
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
