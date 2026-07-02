import express from "express";
import { getMedicinesList } from "../Controllers/pharmacyController.js";

const router = express.Router();

router.get("/medicines", getMedicinesList);

export default router;
