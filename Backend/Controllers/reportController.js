import prisma from "../utils/prismaClient.js";

export const uploadReport = async (req, res) => {
  const { title, fileUrl, fileType } = req.body;

  if (!title || !fileUrl) {
    return res.status(400).json({
      success: false,
      message: "Title and file URL are required.",
    });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.userId },
    });
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const newReport = await prisma.report.create({
      data: {
        patientId: patient.id,
        title,
        fileUrl,
        fileType: fileType || "image",
      },
    });

    res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: newReport,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    let where = {};
    if (req.role === "patient") {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.userId },
      });
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }
      where = { patientId: patient.id };
    } else if (req.role === "doctor" || req.role === "admin") {
      const { patientId } = req.query;
      if (patientId) {
        // patientId query param is a User.id; resolve to the Patient record.
        let patient = await prisma.patient.findUnique({
          where: { userId: patientId },
        });
        if (!patient) {
          // Fall back to treating patientId directly as a Patient.id.
          patient = await prisma.patient.findUnique({
            where: { id: patientId },
          });
        }
        where = { patientId: patient ? patient.id : patientId };
      } else {
        // if doctor/admin doesn't specify patient, get all
        where = {};
      }
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized role" });
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      include: { patient: { select: { name: true } } },
    });
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteReport = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    // Authorization
    if (req.role !== "admin") {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.userId },
      });
      if (!patient || patient.id !== report.patientId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized action" });
      }
    }

    await prisma.report.delete({ where: { id } });
    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
