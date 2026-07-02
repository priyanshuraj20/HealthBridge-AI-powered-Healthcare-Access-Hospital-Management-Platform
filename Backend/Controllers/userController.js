import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Review from "../models/ReviewSchema.js";

export const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, select: "-password" }
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Successfully Updated",
        data: updatedUser,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id).select("-password");
    res.status(200).json({ success: true, message: "User found", data: user });
  } catch (err) {
    res.status(404).json({ success: false, message: "User not found" });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res
      .status(200)
      .json({ success: true, message: "Users found", data: users });
  } catch (err) {
    res.status(404).json({ success: false, message: "Not found" });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Not authorized" });
    }
    const { password, ...rest } = user._doc;
    res
      .status(200)
      .json({
        success: true,
        message: "Getting Profile Info",
        data: { ...rest },
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Something get wrong, cannot get" });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Getting Appointments", data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong, cannot get appointments" });
  }
};

export const deleteUserAccount = async (req, res) => {
    const userId = req.userId;
    try {

        // Delete user's bookings first
        await Booking.deleteMany({ user: userId });

         // Find all unique doctor IDs associated with the deleted reviews
        const doctors = await Review.distinct("doctor", { user: userId });

        //delete user's review
        await Review.deleteMany({user: userId});
    
        // Recalculate average ratings for each doctor
        for (const doctorId of doctors) {
          await Review.calcAverageRatings(doctorId);
        }        

        // Then delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: "User account deleted successfully", data: deletedUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong, cannot delete account" });
    }
};

// Family Member Management
export const addFamilyMember = async (req, res) => {
  const userId = req.userId;
  const { name, relation, gender, birthDate } = req.body;
  if (!name || !relation) {
    return res.status(400).json({ success: false, message: "Name and relation are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.familyMembers.push({ name, relation, gender, birthDate });
    await user.save();

    res.status(200).json({
      success: true,
      message: "Family member added successfully",
      data: user.familyMembers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFamilyMember = async (req, res) => {
  const userId = req.userId;
  const memberId = req.params.memberId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.familyMembers = user.familyMembers.filter((m) => m._id.toString() !== memberId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Family member removed successfully",
      data: user.familyMembers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addFamilyMemberRecord = async (req, res) => {
  const userId = req.userId;
  const memberId = req.params.memberId;
  const { type, record } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const member = user.familyMembers.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Family member not found." });
    }

    if (type === "reports") {
      member.reports.push(record);
    } else if (type === "vaccinations") {
      member.vaccinations.push(record);
    } else if (type === "appointments") {
      member.appointments.push(record);
    } else {
      return res.status(400).json({ success: false, message: "Invalid record type" });
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: "Record added successfully",
      data: user.familyMembers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
