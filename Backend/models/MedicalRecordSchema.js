import mongoose from "mongoose";

const MedicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  recordType: { 
    type: String, 
    enum: ["Report", "Prescription", "Discharge Summary", "Invoice"], 
    required: true 
  },
  fileUrl: { type: String, required: true }, // Cloudinary link (PDF or Image)
  uploadedBy: {
    role: { type: String, enum: ["patient", "doctor", "lab_tech", "receptionist"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  metadata: { type: Map, of: String } // Dynamic properties (e.g. bloodSugar: "140")
}, { timestamps: true });

export default mongoose.model("MedicalRecord", MedicalRecordSchema);
