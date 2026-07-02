import mongoose from "mongoose";

const medicalLoanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospital: {
      type: mongoose.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    treatmentName: { type: String, required: true },
    requestedAmount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    monthlyEMI: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    documents: { type: [String], default: [] }, // S3/Cloudinary links to uploaded proofs
  },
  { timestamps: true }
);

medicalLoanSchema.pre(/^find/, function (next) {
  this.populate("user", "name email phone").populate("hospital", "name");
  next();
});

export default mongoose.model("MedicalLoan", medicalLoanSchema);
