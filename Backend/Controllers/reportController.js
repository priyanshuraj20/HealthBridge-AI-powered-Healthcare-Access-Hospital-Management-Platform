import MedicalReport from "../models/MedicalReportSchema.js";
import User from "../models/UserSchema.js";

export const uploadReport = async (req, res) => {
  const { title, fileUrl, fileType } = req.body;
  const userId = req.userId;

  if (!title || !fileUrl) {
    return res.status(400).json({
      success: false,
      message: "Title and file URL are required.",
    });
  }

  try {
    const newReport = new MedicalReport({
      user: userId,
      title,
      fileUrl,
      fileType: fileType || "image",
    });

    await newReport.save();

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
    let query = {};
    if (req.role === "patient") {
      query.user = req.userId;
    } else if (req.role === "doctor" || req.role === "admin") {
      const { patientId } = req.query;
      if (patientId) {
        query.user = patientId;
      } else {
        // if doctor/admin doesn't specify patient, get all (or return empty)
        query = {};
      }
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized role" });
    }

    const reports = await MedicalReport.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteReport = async (req, res) => {
  const { id } = req.params;
  try {
    const report = await MedicalReport.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    // Authorization
    if (req.role !== "admin" && report.user._id.toString() !== req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized action" });
    }

    await MedicalReport.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
