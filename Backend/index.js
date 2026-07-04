import express from "express";
import prisma from "./utils/prismaClient.js";
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

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
    await seedDatabase();
  } catch (err) {
    console.log("Database connection falied!", err.message);
  }
};

//middlewares
app.use(express.json());

// Outgoing JSON payload Mongoose-to-SQL compatibility mapper
const mapCompatFields = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapCompatFields);
  }
  
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = mapCompatFields(obj[key]);
    }
  }

  // 1. Inject _id if id is present and _id is not
  if (newObj.id && !newObj._id) {
    newObj._id = newObj.id;
  }

  // 2. Doctor field mappings:
  // Copy hospitalId to hospital string (Mongoose compatibility)
  if (newObj.hospitalId && !newObj.hospital) {
    newObj.hospital = newObj.hospitalId;
  }
  // Map photoUrl to photo
  if (newObj.photoUrl && !newObj.photo) {
    newObj.photo = newObj.photoUrl;
  }
  // Map offlinePrice to ticketPrice
  if (newObj.offlinePrice !== undefined && newObj.ticketPrice === undefined) {
    newObj.ticketPrice = newObj.offlinePrice;
  }

  // 3. Appointment field mappings:
  // Copy patient.user to user (telemedicine compatibility)
  if (newObj.patient && newObj.patient.user && !newObj.user) {
    newObj.user = newObj.patient.user;
  }

  return newObj;
};

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    return originalJson.call(this, mapCompatFields(body));
  };
  next();
});

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

