import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // Parent Org
    name: { type: String, required: true, unique: true },
    location: { type: String, default: "Care City" },
    address: { type: String },
    city: { type: String },
    phone: { type: String },
    licenseNumber: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ["Pending", "License Verification", "Approved", "Rejected", "Premium Partner"], 
      default: "Pending" 
    },
    distance: { type: Number, default: 0 }, // in km (for sorting)
    rating: { type: Number, default: 4.5 },
    waitingTime: { type: Number, default: 30 }, // in minutes (for sorting)
    specialties: { type: [String], default: [] },
    supportedInsurances: { type: [String], default: [] },
    beds: {
      icu: {
        total: { type: Number, default: 20 },
        available: { type: Number, default: 5 },
      },
      general: {
        total: { type: Number, default: 100 },
        available: { type: Number, default: 40 },
      },
      private: {
        total: { type: Number, default: 30 },
        available: { type: Number, default: 10 },
      },
      emergency: {
        total: { type: Number, default: 15 },
        available: { type: Number, default: 3 },
      },
    },
    treatmentCosts: [
      {
        treatmentName: { type: String, required: true },
        cost: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Hospital", hospitalSchema);
