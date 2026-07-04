import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../utils/prismaClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "../config/schemesConfig.json");

// Read configuration rules for government schemes dynamically
const getSchemesConfig = () => {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read schemesConfig.json, returning empty list:", err.message);
    return { schemes: [] };
  }
};

// Check eligibility for PM-JAY and other schemes
export const checkSchemeEligibility = async (req, res) => {
  const { schemeId, income, familySize } = req.body;

  if (!schemeId || income === undefined || familySize === undefined) {
    return res.status(400).json({
      success: false,
      message: "Scheme ID, income, and family size are required.",
    });
  }

  try {
    const config = getSchemesConfig();
    const scheme = config.schemes.find((s) => s.id === schemeId);

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    const incomeVal = parseFloat(income);
    const familyVal = parseInt(familySize);

    // Rule-based evaluation
    const isIncomeEligible = incomeVal <= scheme.incomeThreshold;
    const isFamilyEligible = familyVal <= scheme.familySizeLimit;
    const eligible = isIncomeEligible && isFamilyEligible;

    res.status(200).json({
      success: true,
      eligible,
      schemeName: scheme.name,
      maxCoverage: scheme.maxCoverage,
      coveredTreatments: scheme.coveredTreatments,
      requiredDocuments: scheme.requiredDocuments,
      rulesChecked: {
        incomeLimit: scheme.incomeThreshold,
        familyLimit: scheme.familySizeLimit,
        incomePassed: isIncomeEligible,
        familyPassed: isFamilyEligible,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Estimate out-of-pocket expenses based on insurance selection
export const estimateCoverage = async (req, res) => {
  const { hospitalId, treatmentName, insuranceProvider } = req.body;

  if (!hospitalId || !treatmentName) {
    return res.status(400).json({
      success: false,
      message: "Hospital ID and treatment name are required.",
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

    // Find treatment cost
    const treatment = hospital.treatmentCosts.find(
      (t) => t.treatmentName.toLowerCase() === treatmentName.toLowerCase()
    );

    if (!treatment) {
      return res.status(400).json({
        success: false,
        message: `Treatment "${treatmentName}" not available at ${hospital.name}.`,
      });
    }

    const totalCost = treatment.cost;
    let estimatedCoverage = 0;
    let outOfPocket = totalCost;
    let coveragePercentage = 0;
    let note = "No insurance selected. Patient pays full amount.";

    // Check if insurance is accepted by this hospital
    const insurances = (hospital.supportedInsurances || "").split(",").map((s) => s.trim()).filter(Boolean);
    const acceptsInsurance = insurances.some(
      (ins) => ins.toLowerCase() === (insuranceProvider || "").toLowerCase()
    );

    if (insuranceProvider && acceptsInsurance) {
      if (insuranceProvider.toLowerCase().includes("pm-jay") || insuranceProvider.toLowerCase().includes("ayushman")) {
        // Ayushman Bharat covers 100% of approved packages up to 5L
        estimatedCoverage = Math.min(totalCost, 500000);
        coveragePercentage = 100;
        outOfPocket = totalCost - estimatedCoverage;
        note = "PM-JAY covers 100% of treatment charges up to a cap of 500,000 INR.";
      } else {
        // Standard insurance covers 85%, patient copay 15%
        coveragePercentage = 85;
        estimatedCoverage = totalCost * 0.85;
        outOfPocket = totalCost * 0.15;
        note = `Standard network coverage covers 85% at ${hospital.name}. 15% co-payment applies.`;
      }
    } else if (insuranceProvider && !acceptsInsurance) {
      note = `Selected insurance provider "${insuranceProvider}" is outside ${hospital.name}'s accepted network list. No coverage estimated.`;
    }

    res.status(200).json({
      success: true,
      hospitalName: hospital.name,
      treatmentName,
      totalCost,
      insuranceProvider: insuranceProvider || "Self-Pay",
      acceptsInsurance,
      estimatedCoverage,
      outOfPocket,
      coveragePercentage,
      note,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Return globally supported insurance list
export const getSupportedInsurances = (req, res) => {
  const insurances = ["Star Health", "HDFC Ergo", "Max Bupa", "PM-JAY", "State Chief Minister Health Scheme"];
  res.status(200).json({ success: true, data: insurances });
};

// Predict treatment costs across all hospitals
export const predictTreatmentCosts = async (req, res) => {
  const { treatmentName, insuranceProvider } = req.body;
  if (!treatmentName) {
    return res.status(400).json({ success: false, message: "Treatment name is required." });
  }

  try {
    const hospitals = await prisma.hospital.findMany({ include: { treatmentCosts: true } });
    const predictions = hospitals
      .map((h) => {
        const treatment = h.treatmentCosts.find(
          (t) => t.treatmentName.toLowerCase() === treatmentName.toLowerCase()
        );

        if (!treatment) return null;

        const totalCost = treatment.cost;
        const insurances = (h.supportedInsurances || "").split(",").map((s) => s.trim()).filter(Boolean);
        const acceptsInsurance = insurances.some(
          (ins) => ins.toLowerCase() === (insuranceProvider || "").toLowerCase()
        );

        let estimatedCoverage = 0;
        let outOfPocket = totalCost;
        let note = "Self-pay. No insurance coverage.";

        if (insuranceProvider && acceptsInsurance) {
          if (
            insuranceProvider.toLowerCase().includes("pm-jay") ||
            insuranceProvider.toLowerCase().includes("ayushman")
          ) {
            estimatedCoverage = Math.min(totalCost, 500000);
            outOfPocket = totalCost - estimatedCoverage;
            note = "100% Cashless PM-JAY coverage.";
          } else {
            estimatedCoverage = totalCost * 0.85;
            outOfPocket = totalCost * 0.15;
            note = "85% network coverage. 15% co-pay.";
          }
        } else if (insuranceProvider && !acceptsInsurance) {
          note = "Selected insurance outside hospital network.";
        }

        return {
          hospitalName: h.name,
          location: h.location,
          distance: h.distance,
          rating: h.rating,
          waitingTime: h.waitingTime,
          totalCost,
          acceptsInsurance,
          estimatedCoverage,
          outOfPocket,
          note,
        };
      })
      .filter((p) => p !== null);

    res.status(200).json({ success: true, data: predictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

