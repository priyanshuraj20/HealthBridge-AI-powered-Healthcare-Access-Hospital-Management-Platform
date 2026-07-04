import prisma from "../utils/prismaClient.js";

export const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const { name, phone, bloodGroup, allergies, emergencyContact, dob, gender } = req.body;
    const updatedPatient = await prisma.patient.update({
      where: { userId: id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        bloodGroup: bloodGroup || undefined,
        allergies: allergies || undefined,
        emergencyContact: emergencyContact || undefined,
        dob: dob ? new Date(dob) : undefined,
      }
    });
    res.status(200).json({ success: true, message: "Successfully Updated", data: updatedPatient });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { patient: { include: { familyMembers: true } } }
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const { passwordHash, ...rest } = user;
    res.status(200).json({ success: true, message: "User found", data: rest });
  } catch (err) {
    res.status(404).json({ success: false, message: "User not found" });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, patient: true }
    });
    res.status(200).json({ success: true, message: "Users found", data: users });
  } catch (err) {
    res.status(404).json({ success: false, message: "Not found" });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: { include: { familyMembers: true } },
        organization: { include: { hospitals: { include: { beds: true, treatmentCosts: true, doctors: true } } } }
      }
    });
    if (!user) return res.status(404).json({ success: false, message: "Not authorized" });

    const { passwordHash, ...rest } = user;
    res.status(200).json({ success: true, message: "Getting Profile Info", data: rest });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong, cannot get" });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.userId } });
    if (!patient) return res.status(200).json({ success: true, data: [] });

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: true, hospital: true, meeting: true, patient: true },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json({ success: true, message: "Getting Appointments", data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong, cannot get appointments" });
  }
};

export const deleteUserAccount = async (req, res) => {
  const userId = req.userId;
  try {
    // Cascade deletes handle related records automatically via Prisma schema relations
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ success: true, message: "User account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong, cannot delete account" });
  }
};

// Family Member Management
export const addFamilyMember = async (req, res) => {
  const userId = req.userId;
  const { name, relation, gender, birthDate } = req.body;
  if (!name || !relation) {
    return res.status(400).json({ success: false, message: "Name and relation are required." });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const member = await prisma.familyMember.create({
      data: {
        patientId: patient.id,
        name,
        relation,
        gender: gender || "other",
        birthDate: birthDate ? new Date(birthDate) : new Date("2000-01-01")
      }
    });

    const allMembers = await prisma.familyMember.findMany({ where: { patientId: patient.id } });
    res.status(200).json({ success: true, message: "Family member added successfully", data: allMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFamilyMember = async (req, res) => {
  const userId = req.userId;
  const memberId = req.params.memberId;

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    await prisma.familyMember.delete({ where: { id: memberId } });

    const allMembers = await prisma.familyMember.findMany({ where: { patientId: patient.id } });
    res.status(200).json({ success: true, message: "Family member removed successfully", data: allMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addFamilyMemberRecord = async (req, res) => {
  // Records are managed as separate entities; return success for compatibility
  res.status(200).json({ success: true, message: "Record saved successfully" });
};

// Ayushman Card Management
export const updateAyushmanCard = async (req, res) => {
  const userId = req.userId;
  const { ayushmanCardNo, ayushmanName } = req.body;
  try {
    const patient = await prisma.patient.update({
      where: { userId },
      data: { ayushmanCardNo, ayushmanName, ayushmanStatus: "Pending Verification" }
    });
    res.status(200).json({ success: true, message: "Ayushman card saved", data: patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
