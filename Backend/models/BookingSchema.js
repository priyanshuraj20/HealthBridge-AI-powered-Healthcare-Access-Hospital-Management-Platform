import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketPrice: { type: Number, required: true },
    appointmentDate: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    timeSlot: {
      day: { type: String, required: true },
      startingTime: { type: String, required: true },
      endingTime: { type: String, required: true },
    },
    symptoms: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show", "rescheduled", "approved"],
      default: "pending",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    session: {
      type: String,
      required: false,
    },
    consultationType: {
      type: String,
      enum: ["physical", "video-instant", "video-followup"],
      default: "physical",
    },
    prescribedTests: {
      type: [String],
      default: [],
    },
    uploadedReports: [
      {
        name: { type: String },
        fileUrl: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    meetingRoom: {
      type: String,
      default: "",
    },
    followupExpiry: {
      type: Date,
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    aiSummary: {
      symptoms: { type: String, default: "" },
      diagnosis: { type: String, default: "" },
      medications: { type: String, default: "" },
      tests: { type: String, default: "" },
      followupDate: { type: String, default: "" },
      reminders: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate("user").populate({
    path: "doctor",
    select: "name photo specialization ticketPrice",
  });
  next();
});

export default mongoose.model("Booking", bookingSchema);
