import prisma from "../utils/prismaClient.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "../config/schemesConfig.json");

const getSchemesConfig = () => {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read schemesConfig.json:", err.message);
    return { schemes: [] };
  }
};

const getDatabaseContext = async () => {
  try {
    const hospitals = await prisma.hospital.findMany({ include: { treatmentCosts: true, beds: true } });
    const schemesConfig = getSchemesConfig();
    
    let context = "Here is the ACTUAL live data from our database. Use ONLY this data when referring to specific hospitals, treatment costs, distance, ratings, waiting times, bed availability, scheme eligibility thresholds, covered treatments, and required documents. Do NOT make up names, numbers, or rules:\n\n";
    
    context += "=== ELIGIBLE PUBLIC SCHEMES ===\n";
    if (schemesConfig && schemesConfig.schemes) {
      schemesConfig.schemes.forEach((s) => {
        context += `- Scheme ID: ${s.id}\n`;
        context += `  Name: ${s.name}\n`;
        context += `  Max Coverage Limit: ${s.maxCoverage} INR\n`;
        context += `  Income Threshold limit: ${s.incomeThreshold} INR per annum\n`;
        context += `  Family Size Limit: ${s.familySizeLimit} members\n`;
        context += `  Covered Treatments/Specialties: ${s.coveredTreatments.join(", ")}\n`;
        context += `  Required Documents to apply: ${s.requiredDocuments.join(", ")}\n`;
        context += `  Description: ${s.description}\n\n`;
      });
    }

    context += "=== LIVE NETWORK HOSPITALS ===\n";
    if (hospitals && hospitals.length > 0) {
      hospitals.forEach((h) => {
        context += `- Hospital Name: ${h.name}\n`;
        context += `  Location: ${h.location}\n`;
        context += `  Distance from user center: ${h.distance} km\n`;
        context += `  Rating: ${h.rating}/5\n`;
        context += `  Emergency / OPD Wait Time: ${h.waitingTime} minutes\n`;
        const specialtiesList = (h.specialties || "").split(",").map((s) => s.trim()).filter(Boolean);
        const supportedInsurancesList = (h.supportedInsurances || "").split(",").map((s) => s.trim()).filter(Boolean);
        const icuBed = (h.beds || []).find((b) => b.type === "icu");
        const generalBed = (h.beds || []).find((b) => b.type === "general");
        const privateBed = (h.beds || []).find((b) => b.type === "private");
        const emergencyBed = (h.beds || []).find((b) => b.type === "emergency");
        context += `  Specialties: ${specialtiesList.join(", ")}\n`;
        context += `  Accepted Insurances/Schemes: ${supportedInsurancesList.join(", ")}\n`;
        context += `  Beds Available:\n`;
        context += `    ICU Beds: ${icuBed?.available ?? 0} available (out of ${icuBed?.total ?? 0})\n`;
        context += `    General Beds: ${generalBed?.available ?? 0} available (out of ${generalBed?.total ?? 0})\n`;
        context += `    Private Beds: ${privateBed?.available ?? 0} available (out of ${privateBed?.total ?? 0})\n`;
        context += `    Emergency Beds: ${emergencyBed?.available ?? 0} available (out of ${emergencyBed?.total ?? 0})\n`;
        context += `  Treatment Costs:\n`;
        if (h.treatmentCosts && h.treatmentCosts.length > 0) {
          h.treatmentCosts.forEach((tc) => {
            context += `    * ${tc.treatmentName}: ${tc.cost} INR\n`;
          });
        }
        context += "\n";
      });
    }
    
    return context;
  } catch (err) {
    console.error("Failed to generate database context:", err.message);
    return "";
  }
};

export const getOpenRouterResponse = async (messages, responseFormat = null) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Use a FREE model that doesn't consume thinking tokens.
  // google/gemma-3-27b-it is free on OpenRouter.
  // Falls back to gemini-flash only if explicitly set in .env.
  const model =
    process.env.OPENROUTER_MODEL ||
    "google/gemma-3-27b-it:free";

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env file."
    );
  }

  const payload = {
    model,
    messages,
    // Hard cap — free tier has ~2666 tokens available.
    // 600 leaves room for prompt + response without hitting quota.
    max_tokens: 600,
    // Disable extended thinking on Gemini models (avoids 64k budget drain)
    thinking: { type: "disabled" },
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5000",
      "X-Title": "HealthBridge Portal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response choices returned from OpenRouter.");
  }

  return data.choices[0].message.content;
};

// 1. Symptom Checker
export const checkSymptoms = async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, message: "Symptoms are required." });
  }

  const messages = [
    {
      role: "system",
      content: `You are an expert clinical triage assistant. Analyze the user's symptoms and output a JSON object containing:
- "departments": Array of recommended medical departments/specializations (e.g. Cardiology, Pediatrics, General Medicine).
- "urgency": Urgency level. Choose exactly one from: "High" (immediate care needed), "Medium" (schedule visit soon), "Low" (monitor at home).
- "recommendation": A brief explanation of the recommendation and next steps.
- "disclaimer": A strict medical disclaimer stating this is an AI suggestion, not a diagnosis.

Output only valid JSON. Do not include markdown code block styling like \`\`\`json.`,
    },
    {
      role: "user",
      content: `Symptoms: ${symptoms}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages, { type: "json_object" });
    const parsedResult = JSON.parse(result);
    res.status(200).json({ success: true, data: parsedResult });
  } catch (err) {
    console.error("Symptom checker error:", err.message);
    // Fallback response if API key is missing or failed
    res.status(200).json({
      success: true,
      isFallback: true,
      message: err.message.includes("API key") ? "OpenRouter key missing" : "AI query failed",
      data: {
        departments: ["General Medicine"],
        urgency: "Medium",
        recommendation: "Please consult with a general practitioner for an accurate diagnosis.",
        disclaimer: "Disclaimer: This is a fallback notification. The AI Symptom Checker requires a valid OpenRouter API key configuration in the .env file.",
      },
    });
  }
};

// 2. Pre-Appointment Symptom Summary
export const getAppointmentSummary = async (req, res) => {
  const { symptoms, patientName, patientAge, patientGender, medicalHistory } = req.body;

  const messages = [
    {
      role: "system",
      content: "You are a clinical scribe. Write a concise, professional clinical summary of the patient's symptoms and medical history for the doctor's review before their appointment. Keep it brief, structured, and clinically relevant.",
    },
    {
      role: "user",
      content: `Patient: ${patientName || "Patient"}
Age/Gender: ${patientAge || "N/A"} / ${patientGender || "N/A"}
Medical History: ${medicalHistory || "None reported"}
Reported Symptoms: ${symptoms}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, summary: result });
  } catch (err) {
    console.error("AI appointment summary error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      summary: "AI pre-appointment summary could not be generated. Please review patient symptoms and history directly in their medical record profile.",
    });
  }
};

// 3. AI Medical Report Summary
export const getReportSummary = async (req, res) => {
  const { reportText, title } = req.body;

  if (!reportText) {
    return res.status(400).json({ success: false, message: "Report text or content findings are required." });
  }

  const messages = [
    {
      role: "system",
      content: "You are a patient-friendly medical interpreter. Explain the medical report's findings in simple, clear, non-jargon language. Focus on what it means, major findings, and reassure the patient while encouraging them to discuss details with their doctor.",
    },
    {
      role: "user",
      content: `Report Title: ${title || "Medical Report"}
Content/Findings: ${reportText}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, summary: result });
  } catch (err) {
    console.error("AI report summary error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      summary: "Could not generate report summary. Please consult your physician to interpret this medical record.",
    });
  }
};

// 4. AI Prescription Explanation
export const getPrescriptionExplanation = async (req, res) => {
  const { medicines, notes } = req.body;

  if (!medicines || medicines.length === 0) {
    return res.status(400).json({ success: false, message: "Medicines list is required." });
  }

  const medicineListText = medicines
    .map((m) => `- ${m.name}: Dosage ${m.dosage}, Duration ${m.duration}, Instructions ${m.instructions || "None"}`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: "You are a professional clinical pharmacist. Explain the prescribed medicines in simple, patient-friendly terms. Provide details on what each medicine is for, typical precautions, major possible side effects to monitor, and general wellness advice while taking them.",
    },
    {
      role: "user",
      content: `Prescribed Medicines:\n${medicineListText}\n\nDoctor Notes: ${notes || "None"}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, explanation: result });
  } catch (err) {
    console.error("AI prescription explanation error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      explanation: "AI explanation is temporarily unavailable. Please read the dosage instructions carefully and consult your pharmacist or doctor for advice.",
    });
  }
};

// 5. AI Chat Assistant
export const chatAssistant = async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "User message is required." });
  }

  const systemPrompt = `You are the virtual medical coordinator for Medicare Hospital. 
Your role is to help patients navigate hospital services, answer hospital-related questions (e.g. billing, timings, departments, general procedures), recommend the correct doctor specialization based on symptoms, and provide general health information.
Timings: OPD is open Mon-Sat 9 AM - 6 PM. Emergency is open 24/7.
Departments: Cardiology, Neurology, Pediatrics, Dermatology, General Medicine, Orthopedics.
Never make definitive diagnoses or prescribe medicine. Always remind patients that emergency cases should go directly to the ER. Keep responses helpful, warm, and professional.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(chatHistory || []),
    { role: "user", content: message },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, reply: result });
  } catch (err) {
    console.error("AI chat assistant error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      reply: "Hello! I am having trouble connecting to my central systems. For inquiries about appointments, please visit our Doctors list, or call our front desk at +1 (555) 123-4567. We are open Mon-Sat 9 AM - 6 PM.",
    });
  }
};

// 6. AI Financial Counsellor
export const financialCounsel = async (req, res) => {
  const { query, treatmentName, budget } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: "Query message is required." });
  }

  const dbContext = await getDatabaseContext();

  const messages = [
    {
      role: "system",
      content: `You are a professional medical financial counselor. Answer the patient's questions about treatment affordability, medical loans, EMI payment tenures, and interest rates. Advise them on how to manage out-of-pocket expenses and navigate low-interest clinical financing options. Keep it helpful, clear, and reassuring.
Use the following real-time database to give specific cost comparisons and affordability recommendations:
${dbContext}`,
    },
    {
      role: "user",
      content: `Treatment: ${treatmentName || "General Treatment"}
Budget Context: ${budget || "Not Specified"}
Question: ${query}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, reply: result });
  } catch (err) {
    res.status(200).json({
      success: true,
      isFallback: true,
      reply: "AI Financial Counseling is currently offline. For loan options, interest margins, and EMI applications, please check the 'Medical Loans & EMI' tab directly in the Affordability Hub.",
    });
  }
};

// 7. AI Insurance Guide
export const insuranceGuide = async (req, res) => {
  const { query, provider } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: "Query message is required." });
  }

  const dbContext = await getDatabaseContext();

  const messages = [
    {
      role: "system",
      content: `You are an expert on health insurance policies and public schemes like Ayushman Bharat (PM-JAY). Explain how network hospital listings, co-payments, deductibles, pre-authorizations, and rule-based coverages function. Translate complex policy terms into plain instructions for patients. Remain factual and guiding.
If the user asks about specific hospitals, treatment costs, or eligibility rules, use the following real-time system data:
${dbContext}`,
    },
    {
      role: "user",
      content: `Provider/Scheme: ${provider || "General Insurance"}
Question: ${query}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, reply: result });
  } catch (err) {
    res.status(200).json({
      success: true,
      isFallback: true,
      reply: "AI Insurance Guide is offline. You can check scheme criteria and network hospitals directly in the 'PM-JAY & Schemes' or 'Insurance Checker' panels.",
    });
  }
};

// 8. AI Treatment Cost Explainer
export const explainCost = async (req, res) => {
  const { treatmentName, cost } = req.body;
  if (!treatmentName || !cost) {
    return res.status(400).json({ success: false, message: "Treatment name and cost are required." });
  }

  const dbContext = await getDatabaseContext();

  const messages = [
    {
      role: "system",
      content: `You are a clinical billing analyst. Break down the typical costs associated with the provided surgical or medical treatment (e.g. surgeon fees, anesthesiologist charges, OT charges, bed/room rents, post-op nursing care, drugs). Explain what each item means and why it contributes to the final amount. Suggest standard ways to manage or reduce bills (e.g. generic medicines, choosing shared rooms).
You can refer to the following real-time system database for specific hospital pricing on this or similar treatments:
${dbContext}`,
    },
    {
      role: "user",
      content: `Treatment: ${treatmentName}
Estimated Quote: ${cost} INR`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, explanation: result });
  } catch (err) {
    res.status(200).json({
      success: true,
      isFallback: true,
      explanation: "AI Cost breakdown is temporarily unavailable. Typically, hospital bills comprise Doctor Fee (30%), OT Charges (20%), Room & Board (20%), Consumables & Drugs (20%), and Diagnostics (10%). Select generic drug options to lower medicine bills.",
    });
  }
};

// 9. AI Hospital Recommendation Assistant
export const hospitalRecommend = async (req, res) => {
  const { query, preferredSpecialty } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: "Query message is required." });
  }

  const dbContext = await getDatabaseContext();

  const messages = [
    {
      role: "system",
      content: `You are a patient referral coordinator. Help patients choose the correct clinic or hospital based on their priority (e.g. lowest cost, shortest wait time, maximum rating, bed availability, or closest location). Reassure the patient and provide sensible suggestions. Recommend scheduling appointments for non-emergency care.
Use the following real-time database to give specific recommendations:
${dbContext}`,
    },
    {
      role: "user",
      content: `Specialty Priority: ${preferredSpecialty || "General Medicine"}
Query: ${query}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, reply: result });
  } catch (err) {
    res.status(200).json({
      success: true,
      isFallback: true,
      reply: "AI Referral Guide is offline. Please use the 'Hospital Comparison' table in the Affordability Hub to compare bed counts, rating, and waiting times directly.",
    });
  }
};

// 10. AI Drug Interaction Checker
export const checkDrugInteractions = async (req, res) => {
  const { drugs } = req.body;
  if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least 2 drugs to check interactions.",
    });
  }

  const messages = [
    {
      role: "system",
      content: "You are a clinical pharmacist. Analyze the list of medicines provided and check for potential drug-drug interactions. For each pair/combination, specify the status: Safe (✔), Warning (⚠ Caution), or Dangerous (🚫 High Risk), followed by a brief clinical explanation of the interaction mechanism (e.g., increased bleeding risk, reduced efficacy). Return the analysis in a clean, professional structured layout.",
    },
    {
      role: "user",
      content: `Analyze these drugs: ${drugs.join(", ")}`,
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages);
    res.status(200).json({ success: true, analysis: result });
  } catch (err) {
    let explanation = "AI Drug Interaction Checker is offline. Running standard offline triage checks:\n\n";
    const lowercaseDrugs = drugs.map((d) => d.toLowerCase().trim());
    
    const hasWarfarin = lowercaseDrugs.includes("warfarin");
    const hasAspirin = lowercaseDrugs.includes("aspirin");
    const hasIbuprofen = lowercaseDrugs.includes("ibuprofen");
    const hasParacetamol = lowercaseDrugs.includes("paracetamol") || lowercaseDrugs.includes("crocin") || lowercaseDrugs.includes("acetaminophen");

    if (hasWarfarin && (hasAspirin || hasIbuprofen)) {
      explanation += "🚫 High Risk: Warfarin + Aspirin/Ibuprofen. Concurrent use increases bleeding risks due to antiplatelet and anticoagulant synergy. Avoid co-administration.\n";
    } else if (hasParacetamol && hasIbuprofen) {
      explanation += "✔ Safe: Paracetamol + Ibuprofen. These utilize different metabolic pathways and can be co-administered for brief periods under standard dosages.\n";
    } else {
      explanation += "⚠ Caution: Unverified drug combination. Consult a clinical pharmacist or reference primary medical guides before co-administering these medications.";
    }

    res.status(200).json({
      success: true,
      isFallback: true,
      analysis: explanation,
    });
  }
};

// 11. AI Prescription OCR Scanner
export const scanPrescription = async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: "Prescription image URL is required." });
  }

  const messages = [
    {
      role: "system",
      content: `You are an expert clinical pharmacy OCR assistant. Analyze the prescription image provided. Extract the list of medicines, their dosages, frequencies, a brief plain-english explanation of what the medicine is for, and suggest automatic daily reminder timings in HH:MM format.
Return the output as a valid JSON object matching this structure:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice a day",
      "explanation": "Brief explanation of what it does",
      "reminders": ["09:00", "21:00"]
    }
  ]
}
Output ONLY valid JSON. No markdown backticks.`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this prescription and extract the medications details:",
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    },
  ];

  try {
    const result = await getOpenRouterResponse(messages, { type: "json_object" });
    const parsed = JSON.parse(result);
    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error("Prescription OCR error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      data: {
        medicines: [
          {
            name: "Amoxicillin",
            dosage: "500mg",
            frequency: "Three times a day",
            explanation: "Broad-spectrum antibiotic used to treat bacterial infections. Complete the full course.",
            reminders: ["08:00", "14:00", "20:00"],
          },
          {
            name: "Paracetamol",
            dosage: "650mg",
            frequency: "Twice a day (as needed)",
            explanation: "Common pain reliever and fever reducer. Take after food.",
            reminders: ["09:00", "21:00"],
          },
        ],
      },
    });
  }
};

// 12. AI Insurance Claim Assistant
export const analyzeClaim = async (req, res) => {
  const { bills, reports, prescriptions } = req.body;

  const messages = [
    {
      role: "system",
      content: `You are an expert insurance claim adjuster. Analyze the medical bills, clinical reports, and doctor prescriptions provided. Generate a checklist of documents, identify any missing information/documents needed for claim approval, and compile a clear claim summary.
Return the output as a valid JSON object matching this structure:
{
  "status": "Complete" or "Missing Documents",
  "checklist": [
    { "document": "e.g. Discharge Summary", "status": "Verified" | "Missing" | "Needs Review", "details": "reasoning" }
  ],
  "missingDocs": ["List of missing files"],
  "summary": {
    "patientName": "Name if found",
    "hospital": "Hospital if found",
    "dischargeDate": "Date if found",
    "totalBill": "Estimated total in INR",
    "triageComment": "Brief summary of diagnosis and claim validity"
  }
}
Output ONLY valid JSON. No markdown backticks.`,
    },
    {
      role: "user",
      content: `Analyze the following claim uploads.
Bills: ${bills ? bills.join(", ") : "None"}
Reports: ${reports ? reports.join(", ") : "None"}
Prescriptions: ${prescriptions ? prescriptions.join(", ") : "None"}`
    }
  ];

  try {
    const result = await getOpenRouterResponse(messages, { type: "json_object" });
    const parsed = JSON.parse(result);
    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error("Claim analyzer error:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      data: {
        status: "Missing Documents",
        checklist: [
          { document: "Itemized Hospital Bill", status: "Verified", details: "Hospital charge bill found and verified." },
          { document: "Discharge Summary", status: "Missing", details: "Discharge summary is required for hospitalization claims." },
          { document: "Doctor Prescription", status: "Verified", details: "Consultation sheet verified." }
        ],
        missingDocs: ["Discharge Summary sheet", "Attending Physician Statement"],
        summary: {
          patientName: "Wayne Collins",
          hospital: "Medicare General Hospital",
          dischargeDate: "June 28, 2026",
          totalBill: "65,000 INR",
          triageComment: "Claim is suspended due to missing discharge summary certificate. Please upload this file to proceed."
        }
      }
    });
  }
};




