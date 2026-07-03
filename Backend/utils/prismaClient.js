import { PrismaClient } from "@prisma/client";

// Singleton pattern — avoids multiple connections during hot-reload in dev
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
