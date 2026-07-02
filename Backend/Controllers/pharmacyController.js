const mockMedicines = [
  {
    brandName: "Crocin 650mg",
    brandPrice: 35,
    genericName: "Paracetamol 650mg",
    genericPrice: 5,
    dosageForm: "Tablet",
    savingsPercentage: 85,
    indication: "Fever and Pain relief",
  },
  {
    brandName: "Augmentin 625 Duo",
    brandPrice: 200,
    genericName: "Amoxycillin + Clavulanic Acid 625mg",
    genericPrice: 45,
    dosageForm: "Tablet",
    savingsPercentage: 77,
    indication: "Bacterial Infections",
  },
  {
    brandName: "Lipitor 10mg",
    brandPrice: 280,
    genericName: "Atorvastatin 10mg",
    genericPrice: 40,
    dosageForm: "Tablet",
    savingsPercentage: 85,
    indication: "High Cholesterol & Cardio Protection",
  },
  {
    brandName: "Pan-D",
    brandPrice: 150,
    genericName: "Pantoprazole 40mg + Domperidone 30mg",
    genericPrice: 30,
    dosageForm: "Capsule",
    savingsPercentage: 80,
    indication: "Acidity, GERD, and Heartburn",
  },
  {
    brandName: "Glycomet GP2",
    brandPrice: 110,
    genericName: "Metformin 500mg + Glimepiride 2mg",
    genericPrice: 22,
    dosageForm: "Tablet",
    savingsPercentage: 80,
    indication: "Type 2 Diabetes Control",
  },
  {
    brandName: "Zyrtec 10mg",
    brandPrice: 90,
    genericName: "Cetirizine 10mg",
    genericPrice: 15,
    dosageForm: "Tablet",
    savingsPercentage: 83,
    indication: "Allergies, Running Nose, Sneezing",
  },
];

// Query medicines list & price margins
export const getMedicinesList = (req, res) => {
  const { query } = req.query;

  try {
    let result = mockMedicines;
    if (query) {
      const searchReg = new RegExp(query, "i");
      result = mockMedicines.filter(
        (m) => searchReg.test(m.brandName) || searchReg.test(m.genericName) || searchReg.test(m.indication)
      );
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
