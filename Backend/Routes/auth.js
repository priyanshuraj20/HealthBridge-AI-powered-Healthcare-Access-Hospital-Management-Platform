import express from "express";
import {
  register,
  login,
  loginAdmin,
  addAdmin,
  forgotPassword,
  resetPassword,
} from "../Controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin", loginAdmin);
router.put("/addAdmin", addAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
