// prisma/seed.ts

import {
  PrismaClient,
  Prisma,
  AccountType,
  PlatformType,
  User,
} from "@prisma/client";
// Sesuaikan path '../lib/utils' jika file utils.ts ada di lokasi berbeda
import { generateProfiles } from "../lib/utils";

const prisma = new PrismaClient();

// Helper function to create Date objects relative to now
const daysFromNow = (days: number): Date => {
  const date = new Date(); // Gets the current date and time
  date.setDate(date.getDate() + days);
  return date;
};

// Helper function to create Date 1 year from now
const oneYearFromNow = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

// Helper interface for Profile (matching utils.ts and schema needs)
interface Profile {
  profile: string;
  pin: string;
  used: boolean;
}

async function main() {
  console.log(`🌱 Start seeding ...`);

  // ==========================
  // 1. Seed Users
  // ==========================
  console.log(`👤 Seeding users...`);
  // (User data remains the same)
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Administrator Utama",
      password: "TrustDigital2024!",
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { username: "operator1" },
    update: {},
    create: {
      username: "operator1",
      name: "Operator Satu",
      password: "Operator123!",
      role: "operator",
    },
  });
  console.log(`👤 Users seeded: admin, operator1`);

  // ===========================================
  // 2. Seed Accounts (Main Stock) - Adjusted expiresAt
  // ===========================================
  console.log(`💼 Seeding main accounts with adjusted expiration dates...`);

  const allPlatforms = Object.values(PlatformType);
  const allAccountTypes = Object.values(AccountType);
  const accountsToCreate: Prisma.AccountCreateManyInput[] = [];
  let accountCounter = 0;

  for (const platform of allPlatforms) {
    for (const type of allAccountTypes) {
      for (let i = 1; i <= 3; i++) {
        const email = `${platform.toLowerCase()}_${type}_${i}@seed.example.com`;
        const password = `pass${i}`;
        let expiresAtDate: Date;

        // --- Adjust expiresAt based on platform name ---
        if (platform.includes("_1_TAHUN")) {
          expiresAtDate = oneYearFromNow(); // Tepat 1 tahun dari sekarang
        } else if (platform.includes("_2_BULAN")) {
          expiresAtDate = daysFromNow(60); // Tepat 60 hari (sekitar 2 bulan)
        } else if (platform.includes("_1_BULAN")) {
          expiresAtDate = daysFromNow(30); // Tepat 30 hari
        } else {
          // Default for platforms without specific duration in name
          expiresAtDate = daysFromNow(30 + (accountCounter % 30)); // Variasi default 30-59 hari
        }
        // --- End Adjustment ---

        accountsToCreate.push({
          email: email,
          password: password,
          type: type,
          platform: platform,
          profiles: generateProfiles(type) as unknown as Prisma.InputJsonValue,
          expiresAt: expiresAtDate, // Gunakan expiresAtDate yang sudah disesuaikan
          reported: false,
        });
        accountCounter++;
      }
    }
    console.log(`   - Prepared 9 main accounts for platform: ${platform}`);
  }

  if (accountsToCreate.length > 0) {
    console.log(
      `💼 Attempting to create ${accountsToCreate.length} main accounts...`
    );
    const result = await prisma.account.createMany({
      data: accountsToCreate,
      skipDuplicates: true,
    });
    console.log(`💼 Successfully created ${result.count} new main accounts.`);
  } else {
    console.log("💼 No main accounts generated to seed.");
  }

  // ===========================================
  // 3. Seed Garansi Accounts (warrantyDate = today, expiresAt adjusted)
  // ===========================================
  console.log(`🛡️ Seeding garansi accounts...`);

  const garansiAccountsToCreate: Prisma.GaransiAccountCreateManyInput[] = [];
  const today = new Date(); // Tanggal hari ini
  let garansiCounter = 0; // Counter terpisah untuk variasi default garansi

  for (const platform of allPlatforms) {
    for (const type of allAccountTypes) {
      // 1 akun per tipe untuk setiap platform
      const email = `garansi_${platform.toLowerCase()}_${type}@seed.example.com`;
      const password = `g_pass_${type}`;
      let garansiExpiresAtDate: Date;

      // --- Adjust expiresAt for Garansi based on platform name ---
      if (platform.includes("_1_TAHUN")) {
        garansiExpiresAtDate = oneYearFromNow(); // Tepat 1 tahun dari sekarang
      } else if (platform.includes("_2_BULAN")) {
        garansiExpiresAtDate = daysFromNow(60); // Tepat 60 hari
      } else if (platform.includes("_1_BULAN")) {
        garansiExpiresAtDate = daysFromNow(30); // Tepat 30 hari
      } else {
        // Default for platforms without specific duration in name
        // Kita buat sedikit variasi agar tidak semua sama persis
        garansiExpiresAtDate = daysFromNow(30 + (garansiCounter % 5)); // Variasi 30-34 hari
      }
      // --- End Adjustment ---

      garansiAccountsToCreate.push({
        email: email,
        password: password,
        type: type,
        platform: platform,
        profiles: generateProfiles(type) as unknown as Prisma.InputJsonValue,
        expiresAt: garansiExpiresAtDate, // Gunakan tanggal expired yg disesuaikan
        warrantyDate: today, // Tanggal garansi tetap hari ini
        isActive: true,
      });
      garansiCounter++;
    }
    console.log(`   - Prepared 3 garansi accounts for platform: ${platform}`);
  }

  if (garansiAccountsToCreate.length > 0) {
    console.log(
      `🛡️ Attempting to create ${garansiAccountsToCreate.length} garansi accounts...`
    );
    const result = await prisma.garansiAccount.createMany({
      data: garansiAccountsToCreate,
      skipDuplicates: true,
    });
    console.log(
      `🛡️ Successfully created ${result.count} new garansi accounts.`
    );
  } else {
    console.log("🛡️ No garansi accounts generated to seed.");
  }

  // ================================================================
  // Opsional: Seed tabel lain (Reported, Assignment, Activity)
  // ================================================================
  console.log(
    `📝 Skipping seeding for ReportedAccount, CustomerAssignment, OperatorActivity.`
  );

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
