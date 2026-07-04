import prisma from "../utils/prismaClient.js";

// Mathematical EMI calculation helper (10% flat annual interest)
const calculateEMI = (amount, months) => {
  const p = parseFloat(amount);
  const n = parseInt(months);
  const annualRate = 0.1; // 10% annual interest rate
  const r = annualRate / 12;

  // Standard EMI Formula: [P x R x (1+R)^N]/[(1+R)^N-1]
  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

// Create a new Medical EMI / Loan request
export const createLoanRequest = async (req, res) => {
  const { hospitalId, treatmentName, requestedAmount, tenureMonths } = req.body;

  if (!hospitalId || !treatmentName || !requestedAmount || !tenureMonths) {
    return res.status(400).json({
      success: false,
      message: "Hospital, treatment name, requested amount, and tenure are required.",
    });
  }

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: { treatmentCosts: true },
    });
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: req.userId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const monthlyEMI = calculateEMI(requestedAmount, tenureMonths);

    const newLoan = await prisma.medicalLoan.create({
      data: {
        patientId: patient.id,
        hospitalId,
        treatmentName,
        requestedAmount: parseFloat(requestedAmount),
        tenureMonths: parseInt(tenureMonths),
        monthlyEMI,
        status: "pending",
      },
    });

    res.status(201).json({
      success: true,
      message: "Medical Loan application submitted successfully.",
      data: newLoan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Retrieve loans for logged-in user (patient or admin)
export const getMyLoans = async (req, res) => {
  try {
    let where = {};
    if (req.role === "patient") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.userId } });
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient not found" });
      }
      where.patientId = patient.id;
    } else if (req.role === "admin") {
      where = {}; // admin sees all
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized role" });
    }

    const loans = await prisma.medicalLoan.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Calculate EMI estimates without saving (for tool widgets)
export const getEmiEstimate = (req, res) => {
  const { amount, months } = req.query;
  if (!amount || !months) {
    return res.status(400).json({ success: false, message: "Amount and months are required." });
  }

  try {
    const emi = calculateEMI(amount, months);
    res.status(200).json({
      success: true,
      amount: parseFloat(amount),
      months: parseInt(months),
      estimatedEMI: emi,
      interestRate: "10% p.a.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
