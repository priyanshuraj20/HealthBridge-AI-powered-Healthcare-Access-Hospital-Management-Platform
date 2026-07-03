import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: Number },
  photo: { type: String },
  role: {
    type: String,
    enum: ["patient", "admin", "receptionist", "lab_tech"],
    default: "patient",
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // For staff linked to a branch
  gender: { type: String, enum: ["male", "female", "other"] },
  bloodGroup: { type: String },
  medicalHistory: { type: String, default: "" },
  emergencyContact: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relationship: { type: String, default: "" },
  },
  appointments: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
  ayushmanCard: {
    cardNumber: { type: String, default: "" },
    holderName: { type: String, default: "" },
    status: { type: String, enum: ["Unverified", "Verified"], default: "Unverified" },
  },
  familyMembers: [
    {
      name: { type: String, required: true },
      relation: { type: String, required: true }, // Parent, Child, Grandparent, Spouse, etc.
      gender: { type: String, enum: ["male", "female", "other"] },
      birthDate: { type: Date },
      reports: [
        {
          name: { type: String },
          fileUrl: { type: String },
          date: { type: Date, default: Date.now }
        }
      ],
      vaccinations: [
        {
          name: { type: String },
          status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
          date: { type: Date }
        }
      ],
      appointments: [
        {
          doctorName: { type: String },
          date: { type: Date },
          timeSlot: { type: String }
        }
      ]
    }
  ],
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

export default mongoose.model("User", UserSchema);
