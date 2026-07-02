import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
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
    booking: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true }, // e.g. "1-0-1" or "1 tablet after breakfast"
        duration: { type: String, required: true }, // e.g. "5 days"
        instructions: { type: String }, // e.g. "Before food"
      },
    ],
    notes: { type: String },
    aiExplanation: { type: String }, // cached AI explanation for medicines
  },
  { timestamps: true }
);

prescriptionSchema.pre(/^find/, function (next) {
  this.populate({
    path: "doctor",
    select: "name specialization ticketPrice",
  }).populate({
    path: "user",
    select: "name email phone",
  });
  next();
});

export default mongoose.model("Prescription", prescriptionSchema);
