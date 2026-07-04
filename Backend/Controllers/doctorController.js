import prisma from "../utils/prismaClient.js";

const TELEMEDICINE_SPECIALTIES = [
  "General Physician", "Psychiatry", "Follow-up Care", "Pediatrics",
  "General Medicine", "Psychiatry/Mental Health", "Pediatric Consults"
];

// Strip the password hash before returning a doctor object and map slots to timeSlots
const stripPassword = (doctor) => {
  if (!doctor) return doctor;
  const { passwordHash, ...rest } = doctor;
  
  // Format database slots to timeSlots for Mongoose frontend compatibility
  const timeSlots = (doctor.slots && doctor.slots.length > 0)
    ? doctor.slots.map(s => ({
        day: s.dayOfWeek,
        startingTime: s.startTime,
        endingTime: s.endTime
      }))
    : [
        { day: "Monday", startingTime: "09:00", endingTime: "10:30" },
        { day: "Wednesday", startingTime: "14:00", endingTime: "15:30" },
        { day: "Friday", startingTime: "10:00", endingTime: "11:30" }
      ];
      
  return { ...rest, timeSlots };
};

export const updateDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    const body = { ...req.body };

    // Map legacy field names onto the Prisma schema
    if (body.ticketPrice !== undefined) {
      body.offlinePrice = body.ticketPrice;
      delete body.ticketPrice;
    }
    if (body.photo !== undefined) {
      body.photoUrl = body.photo;
      delete body.photo;
    }
    // Never allow direct password/relation writes through this endpoint
    delete body.password;
    delete body.passwordHash;
    delete body.reviews;
    delete body.appointments;
    delete body.hospital;

    if (body.isTelemedicine !== undefined) {
      const current = await prisma.doctor.findUnique({ where: { id } });
      const spec = body.specialization || current?.specialization || "";
      const acceptsTelemedicine = TELEMEDICINE_SPECIALTIES.some(s =>
        spec.toLowerCase().includes(s.toLowerCase())
      );
      if (!acceptsTelemedicine) {
        body.isTelemedicine = false;
      }
    }

    const updatedDoctor = await prisma.doctor.update({ where: { id }, data: body });
    res.status(200).json({
      success: true,
      message: "Successfully Updated",
      data: stripPassword(updatedDoctor),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const deleteDoctor = async (req, res) => {
  const id = req.params.id || req.userId;
  try {
    // Related bookings & reviews are removed automatically via onDelete: Cascade
    const deletedDoctor = await prisma.doctor.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Successfully Deleted", data: stripPassword(deletedDoctor) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

export const getSingleDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { 
        slots: true, 
        reviews: { include: { patient: { select: { name: true } } } } 
      }
    });
    res.status(200).json({ success: true, message: "Doctor found", data: stripPassword(doctor) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Doctor not found" });
  }
};

export const getAll = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({ include: { slots: true } });

    if (!doctors.length) {
      return res.status(200).json({ success: true, message: "No doctors found" });
    }

    res.status(200).json({ success: true, message: "Doctors found", data: doctors.map(stripPassword) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get all doctors with filtering, search, sorting & pagination
export const getAllDoctors = async (req, res) => {
  try {
    const { query, specialization, department, minFee, maxFee, sortBy, page, limit, hospital } = req.query;

    const where = { isApproved: "approved" };

    if (hospital) {
      where.hospitalId = hospital;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { specialization: { contains: query, mode: "insensitive" } },
      ];
    }

    // department is not a distinct column in the new schema — treat it like specialization
    const specTerm = specialization || department;
    if (specTerm) {
      where.specialization = { contains: specTerm, mode: "insensitive" };
    }

    if (minFee || maxFee) {
      where.offlinePrice = {};
      if (minFee) where.offlinePrice.gte = parseFloat(minFee);
      if (maxFee) where.offlinePrice.lte = parseFloat(maxFee);
    }

    let orderBy = { createdAt: "desc" };
    if (sortBy === "priceAsc") orderBy = { offlinePrice: "asc" };
    else if (sortBy === "priceDesc") orderBy = { offlinePrice: "desc" };
    else if (sortBy === "rating") orderBy = { rating: "desc" };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skipNum = (pageNum - 1) * limitNum;

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({ where, orderBy, skip: skipNum, take: limitNum, include: { slots: true } })
    ]);

    res.status(200).json({
      success: true,
      message: "Doctors found",
      data: doctors.map(stripPassword),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getDoctorProfile = async (req, res) => {
  const doctorId = req.userId;
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { slots: true } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    });

    const responseData = {
      ...stripPassword(doctor),
      appointments
    };

    res.status(200).json({
      success: true,
      message: "Getting Profile Info",
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isApproved } = req.body;

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isApproved }
    });

    res.status(200).json({ success: true, message: "Doctor status updated", data: stripPassword(updatedDoctor) });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
