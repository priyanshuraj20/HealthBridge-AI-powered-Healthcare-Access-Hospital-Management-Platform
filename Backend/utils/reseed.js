import prisma from "./prismaClient.js";
import { seedDatabase } from "./seeder.js";

async function run() {
  console.log("Deleting existing data for re-seed...");
  try {
    // Delete medical loans first (references Patient & Hospital)
    await prisma.medicalLoan.deleteMany({});
    // Delete appointments (references Patient, Doctor, Hospital)
    await prisma.appointment.deleteMany({});
    // Delete prescriptions (references Patient, Doctor)
    await prisma.prescription.deleteMany({});
    // Delete reviews (references Patient, Doctor)
    await prisma.review.deleteMany({});
    // Delete slots
    await prisma.slot.deleteMany({});
    // Delete doctors
    await prisma.doctor.deleteMany({});
    // Delete treatment costs
    await prisma.treatmentCost.deleteMany({});
    // Delete beds
    await prisma.bed.deleteMany({});
    // Delete hospitals
    await prisma.hospital.deleteMany({});

    console.log("Existing data deleted. Seeding database...");
    await seedDatabase();
    console.log("Database seeded successfully with distinct Cloudinary assets!");
    process.exit(0);
  } catch (e) {
    console.error("Error during re-seed:", e.message);
    process.exit(1);
  }
}

run();
