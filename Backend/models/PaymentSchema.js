import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["Stripe", "Cash", "UPI", "Insurance"], required: true },
  transactionId: { type: String, unique: true },
  status: { type: String, enum: ["Pending", "Settled", "Failed", "Refunded"], default: "Pending" }
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);
