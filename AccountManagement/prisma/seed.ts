// prisma/seed.ts

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Start seeding ...`);

  // ==========================
  // 1. Seed Users
  // ==========================
  console.log(`👤 Seeding users...`);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Administrator Utama",
      password: "TrustDigital2024!", // Pastikan ini di-hash jika Anda memiliki logic hashing
      role: "admin",
    },
  });

  await prisma.user.upsert({
    where: { username: "operator1" },
    update: {},
    create: {
      username: "operator1",
      name: "Operator Satu",
      password: "Operator123!", // Pastikan ini di-hash jika Anda memiliki logic hashing
      role: "operator",
    },
  });

  console.log(`👤 Users seeded: admin, operator1`);
  console.log(`✅ Seeding finished.`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", e.code);
      console.error("Prisma Error Meta:", e.meta);
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      console.error("Prisma Validation Error:", e.message);
    }
    process.exit(1);
  })
  .finally(async () => {
    console.log("🔌 Disconnecting Prisma Client...");
    await prisma.$disconnect();
  });
