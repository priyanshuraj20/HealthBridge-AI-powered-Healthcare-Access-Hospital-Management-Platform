import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import Review from "../models/ReviewSchema.js";

export const updateDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    const body = { ...req.body };
    if (body.isTelemedicine !== undefined) {
      const TELEMEDICINE_SPECIALTIES = [
        "General Physician", "Psychiatry", "Follow-up Care", "Pediatrics", 
        "General Medicine", "Psychiatry/Mental Health", "Pediatric Consults"
      ];
      const spec = body.specialization || (await Doctor.findById(id))?.specialization || "";
      const acceptsTelemedicine = TELEMEDICINE_SPECIALTIES.some(s => 
        spec.toLowerCase().includes(s.toLowerCase())
      );
      if (!acceptsTelemedicine) {
        body.isTelemedicine = false;
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, select: "-password" }
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Successfully Updated",
        data: updatedDoctor,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const deleteDoctor = async (req, res) => {
  const id = req.params.id || req.userId;
  try {
    // Delete doctor's bookings first
    await Booking.deleteMany({ doctor: id });

    //delete doctor's review
    await Review.deleteMany({ doctor: id });

    const deletedDoctor = await Doctor.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Successfully Deleted", data: deletedDoctor});
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

export const getSingleDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    const doctor = await Doctor.findById(id)
      .populate("reviews")
      .select("-password");
    res
      .status(200)
      .json({ success: true, message: "Doctor found", data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Doctor not found" });
  }
};

export const getAll = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select("-password");

    if (!doctors.length) {
      return res.status(200).json({ success: true, message: "No doctors found" });
    }

    res.status(200).json({ success: true, message: "Doctors found", data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Controller function to get all doctors
export const getAllDoctors = async (req, res) => {
  try {
    const { query, specialization, department, gender, minFee, maxFee, sortBy, page, limit, hospital } = req.query;

    let filter = { isApproved: "approved" };

    if (hospital) {
      filter.hospital = hospital;
    }

    if (query) {
      filter.$or = [
        { name: new RegExp(query, "i") },
        { specialization: new RegExp(query, "i") },
        { department: new RegExp(query, "i") }
      ];
    }

    if (specialization) {
      filter.specialization = new RegExp(specialization, "i");
    }
    if (department) {
      filter.department = new RegExp(department, "i");
    }
    if (gender) {
      filter.gender = gender;
    }
    if (minFee || maxFee) {
      filter.ticketPrice = {};
      if (minFee) filter.ticketPrice.$gte = parseFloat(minFee);
      if (maxFee) filter.ticketPrice.$lte = parseFloat(maxFee);
    }

    let sortObj = {};
    if (sortBy === "priceAsc") {
      sortObj.ticketPrice = 1;
    } else if (sortBy === "priceDesc") {
      sortObj.ticketPrice = -1;
    } else if (sortBy === "rating") {
      sortObj.averageRating = -1;
    } else {
      sortObj.createdAt = -1;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skipNum = (pageNum - 1) * limitNum;

    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter)
      .select("-password")
      .sort(sortObj)
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: "Doctors found",
      data: doctors,
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
  //console.log("Doctor ID:", doctorId);  // Debugging statement
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    const { password, ...doctorData } = doctor._doc;
    const appointments = await Booking.find({ doctor: doctorId }).sort({ appointmentDate: 1, "timeSlot.startingTime": 1 });

    const responseData = {
      ...doctorData,
      appointments: appointments
    };

    res
      .status(200)
      .json({
        success: true,
        message: "Getting Profile Info",
        data: responseData,
      });
  } catch (err) {
    // Debugging statement
    res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isApproved } = req.body;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isApproved },
      { new: true } 
    ).select("-password");

    if (!updatedDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({ success: true, message: "Doctor status updated", data: updatedDoctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
