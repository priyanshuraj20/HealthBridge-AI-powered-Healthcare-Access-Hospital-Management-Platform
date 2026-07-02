import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  taxId: { type: String, required: true, unique: true },
  adminEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "org_admin" }
}, { timestamps: true });

export default mongoose.model("Organization", OrganizationSchema);
