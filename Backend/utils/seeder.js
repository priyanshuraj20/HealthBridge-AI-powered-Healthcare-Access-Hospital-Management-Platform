import prisma from "./prismaClient.js";
import bcrypt from "bcryptjs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const assets = require("./uploaded_assets.json");

// Helper hospital names
const indianHospitals = [
  "Fortis Hospital", "Max Super Speciality", "Apollo Hospital", "Manipal Hospital", "Medanta The Medicity",
  "Narayana Health", "BLK-Max Super Speciality", "Sir Ganga Ram Hospital", "Kokilaben Dhirubhai Ambani Hospital",
  "Lilavati Hospital", "Gleneagles Global Hospital", "Tata Memorial Hospital", "KIMS Hospital", "Yashoda Hospital",
  "Care Hospital", "Aster DM Healthcare", "Ruby Hall Clinic", "Sahyadri Hospital", "Columbia Asia Hospital",
  "Amrita Hospital", "Artemis Hospital", "Wockhardt Hospital", "Shalby Hospital", "MIOT International",
  "Ganga Hospital", "PSG Hospitals", "Christian Medical College", "St. John's Medical College", "KEM Hospital",
  "Sion Hospital", "Nair Hospital", "J J Hospital", "Ram Manohar Lohia Hospital", "Safdarjung Hospital",
  "Lok Nayak Hospital", "GTB Hospital", "Deen Dayal Upadhyay Hospital", "Sanjay Gandhi Postgraduate Institute",
  "King George's Medical University", "Command Hospital"
];

const internationalHospitals = [
  "Mayo Clinic", "Cleveland Clinic", "Massachusetts General Hospital", "Johns Hopkins Hospital",
  "Mount Sinai Hospital", "Guy's and St Thomas' Hospital", "Royal Free Hospital", "King's College Hospital",
  "Cleveland Clinic Abu Dhabi", "Mediclinic Welcare Hospital", "American Hospital Dubai",
  "Mount Elizabeth Hospital", "Raffles Hospital", "Singapore General Hospital", "Toronto General Hospital"
];

const specialtiesList = [
  "Cardiology", "Neurology", "General Surgery", "Pediatrics", "Dermatology", "Orthopedics", "Ophthalmology", "General Medicine"
];

const doctorNames = [
  "Dr. Aarav Mehta", "Dr. Sunita Sharma", "Dr. Amit Verma", "Dr. Pooja Nair",
  "Dr. Vikram Malhotra", "Dr. Sanjay Sen", "Dr. Rajesh Iyer", "Dr. Priya Patel",
  "Dr. John Smith", "Dr. Emily Taylor", "Dr. Sarah Jenkins", "Dr. Ahmed Al-Mansoori",
  "Dr. Michael Chang", "Dr. Grace Wong", "Dr. David Miller", "Dr. Lisa Anderson",
  "Dr. Rohan Deshmukh", "Dr. Kavita Joshi", "Dr. Sandeep Kapoor", "Dr. Ananya Roy",
  "Dr. Arjun Reddy", "Dr. Deepa Nair", "Dr. Vinay Kumar", "Dr. Swati Sharma",
  "Dr. Neha Gupta", "Dr. Rahul Saxena", "Dr. Sneha Patil", "Dr. Manoj Mishra",
  "Dr. Divya Iyer", "Dr. Sameer Khan", "Dr. Ritu Choudhary", "Dr. Vivek Singh",
  "Dr. Preeti Verma", "Dr. Alok Pandey", "Dr. Shruti Joshi", "Dr. Kunal Shah",
  "Dr. Meera Nair", "Dr. Ashish Gupta", "Dr. Kiran Rao", "Dr. Tarun Sen",
  "Dr. James Wilson", "Dr. Sophie Martin", "Dr. Fatma Al-Sayed", "Dr. Kenji Tanaka",
  "Dr. Robert Brown", "Dr. Mary Clark", "Dr. William Johnson", "Dr. Patricia Davis",
  "Dr. Richard Martinez", "Dr. Linda Jones", "Dr. Joseph Garcia", "Dr. Elizabeth Rodriguez",
  "Dr. Charles Thomas", "Dr. Barbara White", "Dr. Christopher Lee", "Dr. Susan Harris",
  "Dr. Daniel Clark", "Dr. Jessica Lewis"
];

const TELEMEDICINE_SPECIALTIES = ["General Physician", "Pediatrics", "Dermatology", "General Medicine"];
const isTelemedicineEligible = (spec) =>
  TELEMEDICINE_SPECIALTIES.some(s => (spec || "").toLowerCase().includes(s.toLowerCase()));

export const seedDatabase = async () => {
  try {
    const hospitalCount = await prisma.hospital.count();
    if (hospitalCount > 0) {
      console.log("Database already seeded (hospitals found). Skipping seeding.");
      return;
    }
    console.log("Starting database seeding process...");

    // 0. Umbrella organization that owns all seeded branches
    const orgPassword = await bcrypt.hash("seededpassword123", 10);
    const orgUser = await prisma.user.upsert({
      where: { email: "network-admin@healthbridge.com" },
      update: {},
      create: {
        email: "network-admin@healthbridge.com",
        passwordHash: orgPassword,
        role: "org_admin",
        organization: {
          create: {
            name: "HealthBridge Network",
            taxId: "HB-NETWORK-0001",
            verificationStatus: "Approved"
          }
        }
      },
      include: { organization: true }
    });
    const organizationId = orgUser.organization.id;

    // 1. Build hospital payloads (with nested beds & treatment costs)
    const hospitalPayloads = [];

    // 40 Indian hospitals
    indianHospitals.forEach((name, index) => {
      const isGovernment = index >= 25;
      const city = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"][index % 8];
      const distance = parseFloat((1.0 + Math.random() * 15.0).toFixed(1));
      const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const waitingTime = isGovernment ? Math.floor(60 + Math.random() * 120) : Math.floor(10 + Math.random() * 40);

      const specialties = [];
      const numSpecialties = 3 + (index % 4);
      for (let i = 0; i < numSpecialties; i++) {
        const spec = specialtiesList[(index + i) % specialtiesList.length];
        if (!specialties.includes(spec)) specialties.push(spec);
      }

      const supportedInsurances = [];
      if (isGovernment) {
        supportedInsurances.push("PM-JAY", "State Chief Minister Health Scheme");
      } else {
        supportedInsurances.push("Star Health", "HDFC Ergo", "Max Bupa");
        if (index % 3 === 0) supportedInsurances.push("PM-JAY");
        if (index % 4 === 0) supportedInsurances.push("State Chief Minister Health Scheme");
      }

      const treatmentCosts = [];
      specialties.forEach(spec => {
        if (spec === "Cardiology") {
          treatmentCosts.push({ treatmentName: "Angioplasty", cost: isGovernment ? 80000 : Math.floor(130000 + Math.random() * 60000) });
          treatmentCosts.push({ treatmentName: "Cardiology Consult", cost: isGovernment ? 100 : Math.floor(1000 + Math.random() * 1000) });
        } else if (spec === "Neurology") {
          treatmentCosts.push({ treatmentName: "Neurological Consult", cost: isGovernment ? 150 : Math.floor(1200 + Math.random() * 1000) });
        } else if (spec === "General Surgery") {
          treatmentCosts.push({ treatmentName: "Appendix Surgery", cost: isGovernment ? 10000 : Math.floor(60000 + Math.random() * 30000) });
          treatmentCosts.push({ treatmentName: "Hernia Surgery", cost: isGovernment ? 12000 : Math.floor(45000 + Math.random() * 25000) });
        } else if (spec === "Pediatrics") {
          treatmentCosts.push({ treatmentName: "General Checkup", cost: isGovernment ? 50 : Math.floor(500 + Math.random() * 500) });
        } else if (spec === "Dermatology") {
          treatmentCosts.push({ treatmentName: "Dermatological Triage", cost: isGovernment ? 80 : Math.floor(800 + Math.random() * 800) });
        } else if (spec === "Orthopedics") {
          treatmentCosts.push({ treatmentName: "Knee Replacement", cost: isGovernment ? 100000 : Math.floor(180000 + Math.random() * 70000) });
        } else if (spec === "Ophthalmology") {
          treatmentCosts.push({ treatmentName: "Cataract Operation", cost: isGovernment ? 6000 : Math.floor(22000 + Math.random() * 15000) });
        } else if (spec === "General Medicine") {
          treatmentCosts.push({ treatmentName: "General Checkup", cost: isGovernment ? 20 : Math.floor(300 + Math.random() * 400) });
        }
      });

      hospitalPayloads.push({
        organizationId,
        name: `${name} (${city})`,
        location: `${city} Medical Zone`,
        city,
        distance,
        rating,
        waitingTime,
        photoUrl: assets.hospitals[index % assets.hospitals.length],
        verificationStatus: "Approved",
        specialties: specialties.join(","),
        supportedInsurances: supportedInsurances.join(","),
        beds: {
          create: [
            { type: "icu", total: 20 + (index % 10), available: Math.floor(Math.random() * 10) },
            { type: "general", total: 100 + (index % 50), available: Math.floor(Math.random() * 40) },
            { type: "private", total: 15 + (index % 15), available: Math.floor(Math.random() * 8) },
            { type: "emergency", total: 10 + (index % 5), available: Math.floor(Math.random() * 5) }
          ]
        },
        treatmentCosts: { create: treatmentCosts }
      });
    });

    // 15 International hospitals
    internationalHospitals.forEach((name, index) => {
      const country = ["USA", "UK", "UAE", "Canada", "Singapore", "Australia"][index % 6];
      const city = ["New York", "London", "Dubai", "Toronto", "Singapore", "Sydney"][index % 6];
      const distance = parseFloat((500.0 + Math.random() * 8000.0).toFixed(1));
      const rating = parseFloat((4.2 + Math.random() * 0.8).toFixed(1));
      const waitingTime = Math.floor(10 + Math.random() * 30);

      const specialties = ["General Medicine", "Cardiology", "Neurology", "General Surgery", "Pediatrics", "Dermatology", "Orthopedics", "Ophthalmology"];
      const supportedInsurances = ["Cigna", "Aetna", "Blue Cross Blue Shield", "Bupa International", "Allianz Care"];

      const treatmentCosts = [
        { treatmentName: "Angioplasty", cost: Math.floor(500000 + Math.random() * 200000) },
        { treatmentName: "Appendix Surgery", cost: Math.floor(250000 + Math.random() * 100000) },
        { treatmentName: "Hernia Surgery", cost: Math.floor(200000 + Math.random() * 80000) },
        { treatmentName: "General Checkup", cost: Math.floor(2000 + Math.random() * 3000) },
        { treatmentName: "Cardiology Consult", cost: Math.floor(5000 + Math.random() * 5000) },
        { treatmentName: "Neurological Consult", cost: Math.floor(6000 + Math.random() * 5000) },
        { treatmentName: "Cataract Operation", cost: Math.floor(80000 + Math.random() * 50000) }
      ];

      hospitalPayloads.push({
        organizationId,
        name: `${name} (${city}, ${country})`,
        location: `${city} Health Center`,
        city,
        distance,
        rating,
        waitingTime,
        photoUrl: assets.hospitals[(index + indianHospitals.length) % assets.hospitals.length],
        verificationStatus: "Approved",
        specialties: specialties.join(","),
        supportedInsurances: supportedInsurances.join(","),
        beds: {
          create: [
            { type: "icu", total: 30, available: 12 },
            { type: "general", total: 150, available: 68 },
            { type: "private", total: 60, available: 25 },
            { type: "emergency", total: 20, available: 9 }
          ]
        },
        treatmentCosts: { create: treatmentCosts }
      });
    });

    // Insert hospitals sequentially so we can capture their ids for doctor linkage
    const insertedHospitals = [];
    for (const payload of hospitalPayloads) {
      const created = await prisma.hospital.create({ data: payload });
      insertedHospitals.push(created);
    }
    console.log(`Successfully seeded ${insertedHospitals.length} hospitals (40 Indian, 15 International).`);

    // 2. Doctors linked to seeded hospitals
    const doctorPassword = await bcrypt.hash("seededpassword123", 10);

    for (let index = 0; index < doctorNames.length; index++) {
      const name = doctorNames[index];
      const isFemale = index % 2 !== 0;
      const isInternational = index >= 40;

      const specialization = specialtiesList[index % specialtiesList.length];
      let specLabel = specialization;
      if (specialization === "General Surgery") {
        specLabel = "General Surgeon (Appendix, Hernia)";
      } else if (specialization === "General Medicine") {
        specLabel = "General Physician";
      } else {
        specLabel = `${specialization} Specialist`;
      }

      const offlinePrice = isInternational ? Math.floor(3000 + Math.random() * 3000) : Math.floor(300 + Math.random() * 700);
      const telemedicine = isTelemedicineEligible(specLabel);
      const hospitalId = insertedHospitals[index % insertedHospitals.length].id;

      await prisma.doctor.create({
        data: {
          hospitalId,
          name,
          email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@healthbridge.com`,
          passwordHash: doctorPassword,
          specialization: specLabel,
          qualification: "MBBS, MD / MS",
          experienceYears: Math.floor(3 + Math.random() * 20),
          offlinePrice,
          onlinePrice: telemedicine ? Math.max(199, Math.floor(offlinePrice * 0.6)) : null,
          isTelemedicine: telemedicine,
          rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
          bio: `Dedicated medical professional specializing in ${specialization} with focus on clinical excellence and patient care.`,
          photoUrl: isFemale
            ? assets.femaleDoctors[index % assets.femaleDoctors.length]
            : assets.maleDoctors[index % assets.maleDoctors.length]
        }
      });
    }
    console.log(`Successfully seeded ${doctorNames.length} doctors.`);

    // 3. Mock patients & staff
    const patientPassword = await bcrypt.hash("seededpassword123", 10);
    const patients = [
      { email: "rajesh.kumar@healthbridge.com", name: "Rajesh Kumar", bloodGroup: "O+" },
      { email: "priya.patel@healthbridge.com", name: "Priya Patel", bloodGroup: "B+" }
    ];
    for (const p of patients) {
      await prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
          email: p.email,
          passwordHash: patientPassword,
          role: "patient",
          patient: { create: { name: p.name, bloodGroup: p.bloodGroup } }
        }
      });
    }

    const staff = [
      { email: "receptionist@medicare.com", role: "receptionist" },
      { email: "labtech@medicare.com", role: "lab_tech" }
    ];
    for (const s of staff) {
      await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: { email: s.email, passwordHash: patientPassword, role: s.role }
      });
    }
    console.log("Mock Patients & Hospital Staff users seeded successfully.");
  } catch (err) {
    console.error("Error seeding database:", err.message);
  }
};
