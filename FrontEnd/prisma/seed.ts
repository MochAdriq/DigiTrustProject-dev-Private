import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to generate profiles
const generateProfiles = (
  type: "private" | "sharing",
  customCount?: number
) => {
  const defaultCount = type === "private" ? 8 : 20;
  const count = customCount || defaultCount;
  const profiles = [];

  const profilePatterns = [
    { profile: "Profile A", pin: "1111", used: false },
    { profile: "Profile B", pin: "2222", used: false },
    { profile: "Profile C", pin: "3333", used: false },
    { profile: "Profile D", pin: "4444", used: false },
    { profile: "Profile E", pin: "5555", used: false },
    { profile: "Profile F", pin: "6666", used: false },
    { profile: "Profile G", pin: "7777", used: false },
    { profile: "Profile H", pin: "8888", used: false },
    { profile: "Profile I", pin: "9999", used: false },
    { profile: "Profile J", pin: "0000", used: false },
    { profile: "Profile K", pin: "1234", used: false },
    { profile: "Profile L", pin: "5678", used: false },
    { profile: "Profile M", pin: "9012", used: false },
    { profile: "Profile N", pin: "3456", used: false },
    { profile: "Profile O", pin: "7890", used: false },
    { profile: "Profile P", pin: "2468", used: false },
    { profile: "Profile Q", pin: "1357", used: false },
    { profile: "Profile R", pin: "9753", used: false },
    { profile: "Profile S", pin: "8642", used: false },
    { profile: "Profile T", pin: "1470", used: false },
  ];

  for (let i = 0; i < count; i++) {
    const patternIndex = i % profilePatterns.length;
    profiles.push(profilePatterns[patternIndex]);
  }

  return profiles;
};

// Helper function to calculate expiration date (23 days from creation)
const calculateExpirationDate = (creationDate: Date): Date => {
  const expirationDate = new Date(creationDate);
  expirationDate.setDate(expirationDate.getDate() + 23);
  return expirationDate;
};

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user from README.md
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      password: "admin123", // In production, hash this password
    },
    create: {
      username: "admin",
      password: "admin123", // In production, hash this password
      role: "admin",
    },
  });

  // Create operator user from README.md
  const operatorUser = await prisma.user.upsert({
    where: { username: "operator" },
    update: {
      password: "operator123", // In production, hash this password
    },
    create: {
      username: "operator",
      password: "operator123", // In production, hash this password
      role: "operator",
    },
  });

  console.log("👤 Created users:", { adminUser, operatorUser });

  // Hapus user 'operator1' jika ada
  try {
    await prisma.user.delete({ where: { username: "operator1" } });
    console.log("🗑️ Deleted old 'operator1' user.");
  } catch (error) {
    // Abaikan jika user tidak ada
  }

  // Create sample accounts
  const now = new Date();

  const sampleAccounts = [
    {
      email: "netflix1@example.com",
      password: "password123",
      type: "private",
      profiles: generateProfiles("private"),
      createdAt: now,
      expiresAt: calculateExpirationDate(now),
      isGaransiOnly: false,
    },
    {
      email: "netflix2@example.com",
      password: "password456",
      type: "sharing",
      profiles: generateProfiles("sharing"),
      createdAt: now,
      expiresAt: calculateExpirationDate(now),
      isGaransiOnly: false,
    },
    {
      email: "netflix3@example.com",
      password: "password789",
      type: "private",
      profiles: generateProfiles("private"),
      createdAt: now,
      expiresAt: calculateExpirationDate(now),
      isGaransiOnly: false,
    },
  ];

  for (const accountData of sampleAccounts) {
    await prisma.account.upsert({
      where: { email: accountData.email },
      update: {},
      create: accountData as any,
    });
  }

  console.log("📦 Created sample accounts");

  // Create sample garansi accounts
  const warrantyDate = new Date();
  warrantyDate.setDate(warrantyDate.getDate() - 7); // 7 days ago

  const sampleGaransiAccounts = [
    {
      email: "garansi1@example.com",
      password: "garansi123",
      type: "private",
      profiles: generateProfiles("private"),
      createdAt: warrantyDate,
      expiresAt: calculateExpirationDate(warrantyDate),
      warrantyDate: warrantyDate,
    },
    {
      email: "garansi2@example.com",
      password: "garansi456",
      type: "sharing",
      profiles: generateProfiles("sharing"),
      createdAt: warrantyDate,
      expiresAt: calculateExpirationDate(warrantyDate),
      warrantyDate: warrantyDate,
    },
  ];

  for (const garansiData of sampleGaransiAccounts) {
    await prisma.garansiAccount.upsert({
      where: {
        email_warrantyDate: {
          email: garansiData.email,
          warrantyDate: garansiData.warrantyDate,
        },
      },
      update: {},
      create: garansiData as any,
    });
  }

  console.log("🛡️ Created sample garansi accounts");

  console.log("✅ Database seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
