import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./Routes/auth.js";
import userRoute from "./Routes/user.js";
import doctorRoute from "./Routes/doctor.js";
import reviewRoute from "./Routes/review.js";
import bookingRoute from "./Routes/booking.js";
import messageRoute from "./Routes/message.js";
import prescriptionRoute from "./Routes/prescription.js";
import reportRoute from "./Routes/report.js";
import aiRoute from "./Routes/ai.js";
import { seedDatabase } from "./utils/seeder.js";
import hospitalRoute from "./Routes/hospital.js";
import affordabilityRoute from "./Routes/affordability.js";
import financialRoute from "./Routes/financial.js";
import pharmacyRoute from "./Routes/pharmacy.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const corsOption = {
  origin: true,
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true
};

app.get("/", (req, res) => {
  res.send("Api is working");
});

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected successfully");
    await seedDatabase();
  } catch (err) {
    console.log("Database connection falied!");
  }
};

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOption));
app.use("/auth", authRoute);
app.use("/users", userRoute);
app.use("/doctors", doctorRoute);
app.use("/reviews", reviewRoute);
app.use("/bookings", bookingRoute);
app.use("/messages", messageRoute);
app.use("/prescriptions", prescriptionRoute);
app.use("/reports", reportRoute);
app.use("/ai", aiRoute);
app.use("/hospitals", hospitalRoute);
app.use("/affordability", affordabilityRoute);
app.use("/financial", financialRoute);
app.use("/pharmacy", pharmacyRoute);

app.listen(port, () => {
  connectDB();
  console.log(`server is listening to the port ${port}`);
});

