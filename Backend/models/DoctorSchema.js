import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }, // Linked Hospital Branch
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: Number },
  photo: { type: String },
  ticketPrice: { type: Number, default: 0 },
  role: {
    type: String,
    default: "doctor",
  },
  specialization: { type: String, default: "" },
  department: { type: String, default: "" },
  languages: { type: [String], default: [] },
  qualifications: {
    type: Array,
    default: [],
  },
  experiences: {
    type: Array,
    default: [],
  },
  bio: { type: String, maxLength: 200 },
  about: { type: String },
  timeSlots: { type: Array, default: [] },
  gender: { type: String, enum: ["male", "female", "other"] },
  isApproved: {
    type: String,
    enum: ["pending", "approved", "cancelled"],
    default: "pending",
  },
  reviews: [{ type: mongoose.Types.ObjectId, ref: "Review" }],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalRating: {
    type: Number,
    default: 0,
  },
  appointments: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

export default mongoose.model("Doctor", DoctorSchema);
