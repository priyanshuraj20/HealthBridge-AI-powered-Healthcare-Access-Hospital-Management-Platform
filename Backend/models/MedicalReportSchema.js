import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true }, // Cloudinary link (PDF or Image)
    fileType: { type: String, enum: ["pdf", "image"], default: "image" },
    aiSummary: { type: String }, // AI summary of the medical report content
  },
  { timestamps: true }
);

medicalReportSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email phone",
  });
  next();
});

export default mongoose.model("MedicalReport", medicalReportSchema);
