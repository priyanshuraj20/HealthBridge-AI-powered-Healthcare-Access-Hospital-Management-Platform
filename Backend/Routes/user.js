import express from "express";
import {
  updateUser,
  deleteUserAccount,
  getAllUser,
  getSingleUser,
  getUserProfile,
  getMyAppointments,
  addFamilyMember,
  deleteFamilyMember,
  addFamilyMemberRecord,
} from "../Controllers/userController.js";
import { authenticate, restrict } from "../auth/verifyToken.js";

const router = express.Router();

router.get("/:id", authenticate, restrict(['patient', 'admin']), getSingleUser);
router.get("/", authenticate, restrict(['admin']), getAllUser);
router.put("/:id", authenticate, restrict(['patient', 'admin']), updateUser);
router.delete("/deleteUserAccount", authenticate, restrict(['patient', 'admin']), deleteUserAccount);
router.get("/profile/me", authenticate, restrict(['patient', 'admin']), getUserProfile);
router.get("/appointments/my-appointments", authenticate, restrict(['patient', 'admin']), getMyAppointments);

// Family manager routes
router.post("/family/add", authenticate, restrict(['patient']), addFamilyMember);
router.delete("/family/:memberId", authenticate, restrict(['patient']), deleteFamilyMember);
router.post("/family/:memberId/record", authenticate, restrict(['patient']), addFamilyMemberRecord);

export default router;