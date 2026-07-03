import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    patientToken: {
      type: String,
      default: "",
    },
    hospitalToken: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["created", "active", "ended"],
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
