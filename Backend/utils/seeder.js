import Hospital from "../models/HospitalSchema.js";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";

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

export const seedDatabase = async () => {
  try {
    console.log("Starting database seeding process...");

    // 1. Generate Hospitals
    const generatedHospitals = [];

    // Seed 40 Indian Hospitals
    indianHospitals.forEach((name, index) => {
      const isGovernment = index >= 25; // 15 government/civil centers
      const city = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"][index % 8];
      const distance = parseFloat((1.0 + Math.random() * 15.0).toFixed(1));
      const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const waitingTime = isGovernment ? Math.floor(60 + Math.random() * 120) : Math.floor(10 + Math.random() * 40);
      
      const specialties = [];
      const numSpecialties = 3 + (index % 4); // 3 to 6 specialties
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

      generatedHospitals.push({
        name: `${name} (${city})`,
        location: `${city} Medical Zone`,
        city,
        distance,
        rating,
        waitingTime,
        specialties,
        supportedInsurances,
        beds: {
          icu: { total: 20 + (index % 10), available: Math.floor(Math.random() * 10) },
          general: { total: 100 + (index % 50), available: Math.floor(Math.random() * 40) },
          private: { total: 15 + (index % 15), available: Math.floor(Math.random() * 8) },
          emergency: { total: 10 + (index % 5), available: Math.floor(Math.random() * 5) }
        },
        treatmentCosts
      });
    });

    // Seed 15 International Hospitals
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

      generatedHospitals.push({
        name: `${name} (${city}, ${country})`,
        location: `${city} Health Center`,
        city,
        distance,
        rating,
        waitingTime,
        specialties,
        supportedInsurances,
        beds: {
          icu: { total: 30, available: 12 },
          general: { total: 150, available: 68 },
          private: { total: 60, available: 25 },
          emergency: { total: 20, available: 9 }
        },
        treatmentCosts
      });
    });

    await Hospital.deleteMany({});
    const insertedHospitals = await Hospital.insertMany(generatedHospitals);
    console.log(`Successfully seeded ${insertedHospitals.length} hospitals (40 Indian, 15 International).`);

    // 2. Generate Doctors linked to seeded hospitals
    const mockDoctorsList = [];

    doctorNames.forEach((name, index) => {
      const isFemale = index % 2 !== 0;
      const isInternational = index >= 40;
      
      const specialization = specialtiesList[index % specialtiesList.length];
      const department = specialization;
      
      let specLabel = specialization;
      if (specialization === "General Surgery") {
        specLabel = "General Surgeon (Appendix, Hernia)";
      } else if (specialization === "General Medicine") {
        specLabel = "General Physician";
      } else {
        specLabel = `${specialization} Specialist`;
      }

      const ticketPrice = isInternational ? Math.floor(3000 + Math.random() * 3000) : Math.floor(300 + Math.random() * 700);
      
      // Evenly distribute doctors across all seeded hospitals
      const hospitalIndex = index % insertedHospitals.length;
      const hospitalId = insertedHospitals[hospitalIndex]._id;

      mockDoctorsList.push({
        hospital: hospitalId,
        name,
        email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@healthbridge.com`,
        password: "seededpassword123", // Will be hashed below
        role: "doctor",
        specialization: specLabel,
        department,
        gender: isFemale ? "female" : "male",
        languages: isInternational ? ["English", "Spanish", "French"][index % 3] : ["English", "Hindi", "Regional"][index % 3],
        ticketPrice,
        isApproved: "approved",
        averageRating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
        totalRating: Math.floor(10 + Math.random() * 90),
        bio: `Dedicated medical professional specializing in ${department} with focus on clinical excellence and patient care.`,
        about: `Highly qualified medical practitioner with a proven track record of successful treatments in the field of ${department}.`,
        photo: isFemale 
          ? "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923819/yigjtzlmg0nyaxjr3wv9.jpg"
          : "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782923791/ufn6oplhjmx1hzmydfru.jpg",
        timeSlots: [
          { day: "monday", startingTime: "09:00", endingTime: "12:00" },
          { day: "wednesday", startingTime: "14:00", endingTime: "17:00" },
          { day: "friday", startingTime: "10:00", endingTime: "13:00" }
        ],
        experiences: [
          { hospital: "National Health Centre", position: "Consultant Specialist" }
        ],
        qualifications: [
          { degree: "MBBS", university: "State Medical College" },
          { degree: "MD / MS", university: "PG Institute of Medical Sciences" }
        ]
      });
    });

    await Doctor.deleteMany({ email: { $in: mockDoctorsList.map((d) => d.email) } });

    const hashedDoctors = await Promise.all(
      mockDoctorsList.map(async (doc) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(doc.password, salt);
        return { 
          ...doc, 
          password: hashedPassword
        };
      })
    );

    await Doctor.insertMany(hashedDoctors);
    console.log(`Successfully seeded ${hashedDoctors.length} doctors (male/female, inside/outside India).`);

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
        hospital: insertedHospitals[0]._id
      },
      {
        name: "Vikram LabTech",
        email: "labtech@medicare.com",
        password: "seededpassword123",
        role: "lab_tech",
        gender: "male",
        hospital: insertedHospitals[0]._id
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
