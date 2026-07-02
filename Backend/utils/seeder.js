import Hospital from "../models/HospitalSchema.js";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";

const mockHospitals = [
  {
    name: "Medicare General Hospital",
    location: "Downtown Medical District",
    distance: 2.4,
    rating: 4.8,
    waitingTime: 15,
    specialties: ["Cardiology", "Neurology", "General Surgery", "Pediatrics"],
    supportedInsurances: ["Star Health", "HDFC Ergo", "Max Bupa", "PM-JAY", "State Chief Minister Health Scheme"],
    beds: {
      icu: { total: 15, available: 4 },
      general: { total: 80, available: 22 },
      private: { total: 25, available: 6 },
      emergency: { total: 10, available: 2 },
    },
    treatmentCosts: [
      { treatmentName: "Angioplasty", cost: 150000 },
      { treatmentName: "Hernia Surgery", cost: 65000 },
      { treatmentName: "Cataract Operation", cost: 25000 },
      { treatmentName: "Appendix Surgery", cost: 75000 },
      { treatmentName: "Neurological Consult", cost: 1500 },
      { treatmentName: "General Checkup", cost: 500 },
    ],
  },
  {
    name: "Care & Cure Clinic",
    location: "Suburban Health Hub",
    distance: 6.8,
    rating: 4.2,
    waitingTime: 40,
    specialties: ["Pediatrics", "Ophthalmology", "Dermatology", "General Surgery"],
    supportedInsurances: ["Star Health", "Max Bupa", "State Chief Minister Health Scheme"],
    beds: {
      icu: { total: 5, available: 1 },
      general: { total: 40, available: 15 },
      private: { total: 10, available: 3 },
      emergency: { total: 5, available: 1 },
    },
    treatmentCosts: [
      { treatmentName: "Hernia Surgery", cost: 55000 },
      { treatmentName: "Cataract Operation", cost: 20000 },
      { treatmentName: "Appendix Surgery", cost: 50000 },
      { treatmentName: "Dermatological Triage", cost: 800 },
      { treatmentName: "General Checkup", cost: 400 },
    ],
  },
  {
    name: "Apollo Metro Care",
    location: "City Center Boulevard",
    distance: 4.5,
    rating: 4.6,
    waitingTime: 25,
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "General Surgery"],
    supportedInsurances: ["Star Health", "HDFC Ergo", "PM-JAY"],
    beds: {
      icu: { total: 30, available: 8 },
      general: { total: 150, available: 55 },
      private: { total: 50, available: 18 },
      emergency: { total: 20, available: 5 },
    },
    treatmentCosts: [
      { treatmentName: "Angioplasty", cost: 180000 },
      { treatmentName: "Hernia Surgery", cost: 80000 },
      { treatmentName: "Cataract Operation", cost: 30000 },
      { treatmentName: "Appendix Surgery", cost: 95000 },
      { treatmentName: "Knee Replacement", cost: 220000 },
      { treatmentName: "General Checkup", cost: 600 },
    ],
  },
  {
    name: "Civil General Hospital",
    location: "District Cantonment",
    distance: 8.5,
    rating: 3.9,
    waitingTime: 120,
    specialties: ["General Surgery", "Pediatrics", "Ophthalmology"],
    supportedInsurances: ["PM-JAY", "State Chief Minister Health Scheme"],
    beds: {
      icu: { total: 8, available: 1 },
      general: { total: 200, available: 85 },
      private: { total: 0, available: 0 },
      emergency: { total: 15, available: 3 },
    },
    treatmentCosts: [
      { treatmentName: "Appendix Surgery", cost: 10000 },
      { treatmentName: "Cataract Operation", cost: 5000 },
      { treatmentName: "Hernia Surgery", cost: 12000 },
      { treatmentName: "General Checkup", cost: 50 },
    ],
  },
];

const mockDoctors = [
  {
    name: "Dr. Aarav Mehta",
    email: "aarav.mehta@healthbridge.com",
    password: "seededpassword123", // Will be hashed below
    role: "doctor",
    specialization: "Cardiologist",
    department: "Cardiology",
    languages: ["English", "Hindi", "Gujarati"],
    ticketPrice: 800,
    isApproved: "approved",
    averageRating: 4.9,
    totalRating: 28,
    bio: "Senior Interventional Cardiologist with 15+ years experience.",
    about: "Dedicated to providing advanced cardiovascular care, including angioplasty, pacemaker installations, and heart failure management.",
    photo: "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923791/ufn6oplhjmx1hzmydfru.jpg",
    timeSlots: [
      { day: "monday", startingTime: "09:00", endingTime: "12:00" },
      { day: "wednesday", startingTime: "14:00", endingTime: "17:00" }
    ],
    experiences: [
      { hospital: "AIIMS New Delhi", position: "Resident Cardiologist" },
      { hospital: "Metro Heart Institute", position: "Senior Consultant" }
    ],
    qualifications: [
      { degree: "MBBS", university: "Maulana Azad Medical College" },
      { degree: "DM - Cardiology", university: "AIIMS New Delhi" }
    ]
  },
  {
    name: "Dr. Sunita Sharma",
    email: "sunita.sharma@healthbridge.com",
    password: "seededpassword123",
    role: "doctor",
    specialization: "Neurologist",
    department: "Neurology",
    languages: ["English", "Hindi", "Punjabi"],
    ticketPrice: 900,
    isApproved: "approved",
    averageRating: 4.7,
    totalRating: 19,
    bio: "Consultant Neurologist specializing in stroke and migraine management.",
    about: "Focused on treating neurological issues such as epilepsy, peripheral neuropathy, and cognitive disorders with clinical excellence.",
    photo: "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923819/yigjtzlmg0nyaxjr3wv9.jpg",
    timeSlots: [
      { day: "tuesday", startingTime: "10:00", endingTime: "13:00" },
      { day: "thursday", startingTime: "15:00", endingTime: "18:00" }
    ],
    experiences: [
      { hospital: "Fortis Escorts", position: "Neurology Lead" }
    ],
    qualifications: [
      { degree: "MBBS", university: "Lady Hardinge Medical College" },
      { degree: "MD - Medicine", university: "PGIMER Chandigarh" }
    ]
  },
  {
    name: "Dr. Amit Verma",
    email: "amit.verma@healthbridge.com",
    password: "seededpassword123",
    role: "doctor",
    specialization: "Pediatrician",
    department: "Pediatrics",
    languages: ["English", "Hindi"],
    ticketPrice: 600,
    isApproved: "approved",
    averageRating: 4.8,
    totalRating: 32,
    bio: "Child specialist focusing on pediatric immunizations and development.",
    about: "Providing gentle and expert medical care for infants, children, and adolescents, ensuring healthy growth and prompt disease treatments.",
    photo: "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923793/clo18nr6sx2dvftzqxs6.jpg",
    timeSlots: [
      { day: "monday", startingTime: "14:00", endingTime: "17:00" },
      { day: "friday", startingTime: "09:00", endingTime: "12:00" }
    ],
    experiences: [
      { hospital: "Max Super Specialty", position: "Consultant Pediatrician" }
    ],
    qualifications: [
      { degree: "MBBS", university: "King George's Medical University" },
      { degree: "DCH - Pediatrics", university: "KGMU Lucknow" }
    ]
  },
  {
    name: "Dr. Pooja Nair",
    email: "pooja.nair@healthbridge.com",
    password: "seededpassword123",
    role: "doctor",
    specialization: "Dermatologist",
    department: "Dermatology",
    languages: ["English", "Malayalam", "Tamil"],
    ticketPrice: 700,
    isApproved: "approved",
    averageRating: 4.6,
    totalRating: 15,
    bio: "Dermatologist specializing in clinical skin allergies and therapies.",
    about: "Expert treatment in psoriasis, eczema, acne, hair fall issues, and modern aesthetic skin procedures.",
    photo: "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923794/dczlo6frxnydmqzyc6hu.jpg",
    timeSlots: [
      { day: "tuesday", startingTime: "14:00", endingTime: "17:00" },
      { day: "saturday", startingTime: "10:00", endingTime: "13:00" }
    ],
    experiences: [
      { hospital: "Amrita Institute of Medical Sciences", position: "Assistant Professor" }
    ],
    qualifications: [
      { degree: "MBBS", university: "Govt Medical College Trivandrum" },
      { degree: "MD - Dermatology", university: "JIPMER Puducherry" }
    ]
  }
];

export const seedDatabase = async () => {
  try {
    // 1. Seed Hospitals
    await Hospital.deleteMany({});
    const insertedHospitals = await Hospital.insertMany(mockHospitals);
    console.log("Mock Hospital details seeded successfully.");

    const defaultHospitalId = insertedHospitals[0]._id;

    // 2. Seed/Update Doctors (Upsert seeded records)
    await Doctor.deleteMany({ email: { $in: mockDoctors.map((d) => d.email) } });

    const hashedDoctors = await Promise.all(
      mockDoctors.map(async (doc) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(doc.password, salt);
        return { 
          ...doc, 
          password: hashedPassword,
          hospital: defaultHospitalId
        };
      })
    );

    await Doctor.insertMany(hashedDoctors);
    console.log("Mock Indian Doctors seeded/updated successfully.");

    // 3. Seed Patients & Branch Staff
    const mockUsers = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@healthbridge.com",
        password: "seededpassword123",
        role: "patient",
        gender: "male",
        bloodGroup: "O+"
      },
      {
        name: "Priya Patel",
        email: "priya.patel@healthbridge.com",
        password: "seededpassword123",
        role: "patient",
        gender: "female",
        bloodGroup: "B+"
      },
      {
        name: "Aditi Receptionist",
        email: "receptionist@medicare.com",
        password: "seededpassword123",
        role: "receptionist",
        gender: "female",
        hospital: defaultHospitalId
      },
      {
        name: "Vikram LabTech",
        email: "labtech@medicare.com",
        password: "seededpassword123",
        role: "lab_tech",
        gender: "male",
        hospital: defaultHospitalId
      }
    ];

    await User.deleteMany({ email: { $in: mockUsers.map(u => u.email) } });

    const hashedUsers = await Promise.all(
      mockUsers.map(async (usr) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(usr.password, salt);
        return { ...usr, password: hashedPassword };
      })
    );

    await User.insertMany(hashedUsers);
    console.log("Mock Patients & Hospital Staff users seeded successfully.");

  } catch (err) {
    console.error("Error seeding database:", err.message);
  }
};
