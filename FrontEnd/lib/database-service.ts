// lib/database-service.ts

import { prisma } from "./prisma";
import {
  Prisma,
  Account, // Impor tipe Account langsung jika dibutuhkan di sini
  AccountType as PrismaAccountType,
  PlatformType as PrismaPlatformType,
} from "@prisma/client";
// Pastikan tipe Profile diimpor dengan benar dari lokasi definisinya
import type { Profile } from "./database.types";

// Definisikan tipe string literal (bisa juga diimpor dari file terpisah)
export type AccountType = "private" | "sharing" | "vip";
export type PlatformType =
  | "VIDIO_DIAMOND_MOBILE"
  | "VIU_1_BULAN"
  | "WE_TV"
  | "YOUTUBE_1_BULAN" // Pastikan sesuai schema
  | "HBO"
  | "LOKLOK"
  | "PRIMEVIDEO"
  | "SPOTIFY_FAMPLAN_1_BULAN"
  | "SPOTIFY_FAMPLAN_2_BULAN"
  | "VIDIO_PLATINUM"
  | "CANVA_1_BULAN"
  | "CANVA_1_TAHUN"
  | "CHAT_GPT"
  | "DISNEY"
  | "NETFLIX"
  | "CAPCUT"; // Pastikan ada di schema & generate

// ============================================================
// Helper: Generate Profiles by Account Type
// ============================================================
export const generateProfiles = (type: AccountType): Profile[] => {
  // Pastikan tipe Profile sesuai { profile: string, pin: string, used: boolean }
  const profileCounts: Record<AccountType, number> = {
    sharing: 20,
    private: 8,
    vip: 6, // Pastikan sesuai schema (bukan vvip)
  };
  // Handle jika tipe tidak valid (meski seharusnya sudah divalidasi sebelumnya)
  if (!profileCounts[type]) {
    console.warn(
      `generateProfiles called with invalid type: ${type}. Defaulting to 0 profiles.`
    );
    return [];
  }
  const pins = [
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",
    "0000",
  ];

  return Array.from({ length: profileCounts[type] }).map((_, i) => ({
    profile: `Profile ${i + 1}`,
    pin: pins[i % pins.length],
    used: false,
  }));
};

// ============================================================
// Main Service Class
// ============================================================
export class DatabaseService {
  // ===========================
  // 🔹 ACCOUNT CRUD
  // ===========================

  // Get Semua Akun Utama
  static async getAllAccounts(): Promise<Account[]> {
    return prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Get Akun Utama berdasarkan Tipe
  static async getAccountsByType(type: AccountType): Promise<Account[]> {
    if (!["private", "sharing", "vip"].includes(type)) {
      console.warn(`Invalid account type requested: ${type}`);
      return [];
    }
    return prisma.account.findMany({
      where: { type: type as PrismaAccountType },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get Akun Utama berdasarkan Platform
  static async getAccountsByPlatform(
    platform: PlatformType
  ): Promise<Account[]> {
    // TODO: Validasi platform jika daftar platform dinamis
    return prisma.account.findMany({
      where: { platform: platform as PrismaPlatformType },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get Satu Akun Utama berdasarkan Email (Unique)
  static async getAccountByEmail(email: string): Promise<Account | null> {
    if (!email || typeof email !== "string") return null;
    return prisma.account.findUnique({ where: { email } });
  }

  // Cari Akun Utama berdasarkan Email (Contains)
  static async searchAccountsByEmail(emailQuery: string): Promise<Account[]> {
    const trimmedQuery = emailQuery?.trim(); // Handle null/undefined dan trim
    if (!trimmedQuery) return [];

    return prisma.account.findMany({
      where: {
        email: {
          contains: trimmedQuery,
          mode: "insensitive", // Case-insensitive search
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Batasi hasil pencarian
    });
  }

  // Hitung Profil Tersedia per Tipe Akun Utama
  static async getAvailableProfileCount(type: AccountType): Promise<number> {
    const accountsOfType = await this.getAccountsByType(type);
    let availableCount = 0;
    accountsOfType.forEach((account) => {
      if (Array.isArray(account.profiles)) {
        const profilesArray = account.profiles as unknown as Profile[];
        availableCount += profilesArray.filter(
          (p) => typeof p === "object" && p !== null && p.used === false
        ).length;
      }
    });
    return availableCount;
  }

  // Cek Penggunaan Customer Identifier
  static async isCustomerIdentifierUsed(
    customerIdentifier: string
  ): Promise<boolean> {
    if (!customerIdentifier) return false;
    const assignment = await prisma.customerAssignment.findFirst({
      where: { customerIdentifier: customerIdentifier },
      select: { id: true }, // Hanya butuh tahu ada atau tidak
    });
    return !!assignment;
  }

  // Tambah Satu Akun Utama Baru
  static async addAccount(data: {
    email: string;
    password: string;
    type: AccountType;
    platform: PlatformType;
    expiresAt?: Date;
  }): Promise<Account> {
    // Validasi input
    if (!data.email || !data.password || !data.type || !data.platform) {
      throw new Error("Email, password, type, and platform are required.");
    }
    if (!["private", "sharing", "vip"].includes(data.type)) {
      throw new Error(`Invalid account type: ${data.type}`);
    }
    // TODO: Validasi platform

    // Pastikan email unik sebelum mencoba insert
    const existingAccount = await this.getAccountByEmail(data.email);
    if (existingAccount) {
      throw new Error(`Account with email ${data.email} already exists.`);
    }

    try {
      return await prisma.account.create({
        data: {
          email: data.email,
          password: data.password, // Pertimbangkan hashing
          type: data.type as PrismaAccountType,
          platform: data.platform as PrismaPlatformType,
          profiles: generateProfiles(
            data.type
          ) as unknown as Prisma.InputJsonValue,
          expiresAt:
            data.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 hari
          reported: false,
        },
      });
    } catch (error: any) {
      console.error("Error creating account:", error);
      // Tangani error spesifik Prisma jika perlu
      throw new Error(`Failed to create account ${data.email}.`);
    }
  }

  // Tambah Banyak Akun Utama (Bulk)
  static async addMultipleAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt?: Date
  ): Promise<Account[]> {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("Accounts array cannot be empty.");
    }
    const defaultExpiresAt =
      expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const dataToInsert = accounts.map((a) => {
      // Validasi per item
      if (!a.email || !a.password || !a.type || !a.platform) {
        throw new Error(
          `Invalid account data found in array: ${JSON.stringify(a)}`
        );
      }
      if (!["private", "sharing", "vip"].includes(a.type)) {
        throw new Error(`Invalid account type found in array: ${a.type}`);
      }
      // TODO: Validasi platform
      return {
        email: a.email,
        password: a.password,
        type: a.type as PrismaAccountType,
        platform: a.platform as PrismaPlatformType,
        profiles: generateProfiles(a.type) as unknown as Prisma.InputJsonValue,
        expiresAt: defaultExpiresAt,
        reported: false,
      };
    });

    try {
      const result = await prisma.account.createMany({
        data: dataToInsert,
        skipDuplicates: true, // Sangat penting untuk bulk insert email unik
      });
      console.log(
        `Attempted to insert ${accounts.length} accounts, ${result.count} were new.`
      );

      // Kembalikan akun yang relevan (yang emailnya ada di input)
      return await prisma.account.findMany({
        where: { email: { in: accounts.map((x) => x.email) } },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      console.error("Error during bulk account insert:", error);
      throw new Error("Failed to add multiple accounts.");
    }
  }

  // Update Akun Utama
  static async updateAccount(
    id: string,
    data: {
      email?: string; // Hati-hati jika diubah
      password?: string;
      expiresAt?: Date;
      profiles?: Profile[];
      platform?: PlatformType;
    }
  ): Promise<Account | null> {
    // Ubah return type agar bisa null jika tak ditemukan
    if (!id) throw new Error("Account ID is required for update.");

    const payload: Prisma.AccountUpdateInput = {};
    if (data.email) payload.email = data.email; // Validasi unik ditangani di bawah
    if (data.password) payload.password = data.password;
    if (data.expiresAt) payload.expiresAt = data.expiresAt;
    if (data.platform) payload.platform = data.platform as PrismaPlatformType; // TODO: Validasi
    if (data.profiles)
      payload.profiles = data.profiles as unknown as Prisma.InputJsonValue;

    if (Object.keys(payload).length === 0) {
      console.warn(`No valid data provided to update account ${id}.`);
      return prisma.account.findUnique({ where: { id } }); // Kembalikan data saat ini
    }

    try {
      return await prisma.account.update({
        where: { id },
        data: payload,
      });
    } catch (error: any) {
      console.error(`Error updating account ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (
          error.code === "P2002" &&
          error.meta?.target === "accounts_email_key"
        ) {
          // Error email duplikat
          throw new Error(
            `Failed to update account: Email '${data.email}' is already in use.`
          );
        } else if (error.code === "P2025") {
          // Error record tidak ditemukan
          throw new Error(`Account with ID ${id} not found.`);
        }
      }
      throw new Error(`Failed to update account ${id}.`);
    }
  }

  // Delete Akun Utama
  static async deleteAccount(id: string): Promise<Account> {
    // Kembalikan akun yg terhapus
    if (!id) throw new Error("Account ID is required for deletion.");
    try {
      // Gunakan transaksi
      return await prisma.$transaction(async (tx) => {
        console.log(`Deleting relations for account ${id}...`);
        await tx.customerAssignment.deleteMany({ where: { accountId: id } });
        await tx.reportedAccount.deleteMany({ where: { accountId: id } });
        console.log(`Deleting account ${id}...`);
        const deletedAccount = await tx.account.delete({ where: { id } });
        console.log(
          `Account ${id} (${deletedAccount.email}) deleted successfully.`
        );
        return deletedAccount;
      });
    } catch (error: any) {
      console.error(`Error deleting account ${id}:`, error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Account with ID ${id} not found.`);
      }
      throw new Error(`Failed to delete account ${id}.`);
    }
  }

  // ===========================
  // 🔹 GARANSI ACCOUNTS
  // ===========================
  static async getAllGaransiAccounts() {
    return prisma.garansiAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getGaransiAccountsByDate(date: Date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Invalid date provided for searching by warranty date.");
    }
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.garansiAccount.findMany({
      where: { warrantyDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { warrantyDate: "desc" },
    });
  }

  static async getGaransiAccountsByExpiresAt(date: Date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Invalid date provided for searching by expiry date.");
    }
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.garansiAccount.findMany({
      where: { expiresAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { expiresAt: "asc" },
    });
  }

  static async addGaransiAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt: Date
  ) {
    if (!Array.isArray(accounts) || accounts.length === 0)
      throw new Error("Garansi accounts array cannot be empty.");
    if (
      !expiresAt ||
      !(expiresAt instanceof Date) ||
      isNaN(expiresAt.getTime())
    )
      throw new Error("Invalid or missing expiresAt date.");
    const now = new Date();

    const dataToInsert = accounts.map((a) => {
      if (!a.email || !a.password || !a.type || !a.platform)
        throw new Error(`Invalid garansi data: ${JSON.stringify(a)}`);
      if (!["private", "sharing", "vip"].includes(a.type))
        throw new Error(`Invalid type: ${a.type}`);
      // TODO: Validate platform
      return {
        email: a.email,
        password: a.password,
        type: a.type as PrismaAccountType,
        platform: a.platform as PrismaPlatformType,
        profiles: generateProfiles(a.type) as unknown as Prisma.InputJsonValue,
        expiresAt: expiresAt,
        warrantyDate: now,
        isActive: true,
      };
    });

    try {
      const result = await prisma.garansiAccount.createMany({
        data: dataToInsert,
        skipDuplicates: true,
      });
      console.log(`Inserted ${result.count} new garansi accounts.`);
      return await prisma.garansiAccount.findMany({
        where: { email: { in: accounts.map((x) => x.email) } },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      console.error("Error during bulk garansi account insert:", error);
      throw new Error("Failed to add multiple garansi accounts.");
    }
  }

  // ===========================
  // 🔹 REPORTED ACCOUNTS
  // ===========================
  static async getAllReportedAccounts() {
    // Kembalikan semua, filter resolved=false di client jika perlu (misal: di getReportedAccounts context)
    return prisma.reportedAccount.findMany({
      orderBy: { reportedAt: "desc" },
      include: {
        account: {
          select: { id: true, email: true, type: true, platform: true },
        },
      },
    });
  }

  static async reportAccount(accountId: string, reason: string) {
    if (!accountId || !reason)
      throw new Error("Account ID and reason are required.");
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error(`Account with ID ${accountId} not found.`);

    return prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { reported: true },
      });
      const report = await tx.reportedAccount.create({
        data: { accountId, reportReason: reason },
      });
      console.log(`Account ${account.email} reported: ${reason}`);
      return report;
    });
  }

  static async resolveReport(reportId: string, newPassword?: string) {
    if (!reportId) throw new Error("Report ID is required.");
    return prisma.$transaction(async (tx) => {
      const report = await tx.reportedAccount.findUnique({
        where: { id: reportId },
        select: { accountId: true, resolved: true },
      });
      if (!report) throw new Error(`Report ${reportId} not found.`);
      if (report.resolved) {
        console.warn(`Report ${reportId} already resolved.`);
        return;
      }
      await tx.reportedAccount.update({
        where: { id: reportId },
        data: { resolved: true },
      });
      const accountUpdateData: Prisma.AccountUpdateInput = { reported: false };
      if (newPassword) accountUpdateData.password = newPassword;
      await tx.account.update({
        where: { id: report.accountId },
        data: accountUpdateData,
      });
      console.log(
        `Report ${reportId} resolved. Account ${report.accountId} updated.`
      );
      // Tidak perlu return apa-apa atau return boolean true
    });
  }

  // ===========================
  // 🔹 CUSTOMER ASSIGNMENTS
  // ===========================
  static async getAllCustomerAssignments() {
    return prisma.customerAssignment.findMany({
      orderBy: { assignedAt: "desc" },
      include: {
        account: { select: { id: true, platform: true, expiresAt: true } },
      },
    });
  }

  static async addCustomerAssignment(data: {
    customerIdentifier: string;
    accountId: string;
    accountEmail: string;
    accountType: AccountType;
    profileName: string;
    operatorName?: string;
  }) {
    if (
      !data.customerIdentifier ||
      !data.accountId ||
      !data.accountEmail ||
      !data.accountType ||
      !data.profileName
    ) {
      throw new Error("Missing required fields for assignment.");
    }
    const operator = data.operatorName ?? "System";

    return prisma.$transaction(async (tx) => {
      // 1. Validasi Akun & Profil
      const account = await tx.account.findUnique({
        where: { id: data.accountId },
      });
      if (!account) throw new Error(`Account ${data.accountId} not found.`);
      if (!Array.isArray(account.profiles))
        throw new Error(`Invalid profiles for account ${data.accountId}.`);
      const profilesArray = account.profiles as unknown as Profile[];
      const profileIndex = profilesArray.findIndex(
        (p) =>
          typeof p === "object" &&
          p !== null &&
          p.profile === data.profileName &&
          !p.used
      );
      if (profileIndex === -1)
        throw new Error(`Profile '${data.profileName}' not found or used.`);

      // 2. Buat Assignment
      const assignment = await tx.customerAssignment.create({
        data: {
          customerIdentifier: data.customerIdentifier,
          accountId: data.accountId,
          accountEmail: data.accountEmail,
          accountType: data.accountType as PrismaAccountType,
          profileName: data.profileName,
          operatorName: operator,
        },
      });

      // 3. Catat Aktivitas
      await tx.operatorActivity.create({
        data: {
          operatorName: operator,
          action: `Assign profile ${data.profileName} (${data.accountType}) to ${data.customerIdentifier}`,
          accountEmail: data.accountEmail,
          accountType: data.accountType as PrismaAccountType,
        },
      });

      // 4. Update Profil jadi 'used'
      const updatedProfiles = [...profilesArray];
      const targetProfile = updatedProfiles[profileIndex];
      updatedProfiles[profileIndex] = { ...targetProfile, used: true };
      await tx.account.update({
        where: { id: data.accountId },
        data: { profiles: updatedProfiles as unknown as Prisma.InputJsonValue },
      });
      console.log(
        `Profile ${data.profileName} on account ${data.accountId} marked as used.`
      );

      return assignment;
    });
  }

  // ===========================
  // 🔹 OPERATOR ACTIVITIES
  // ===========================
  static async getAllOperatorActivities() {
    return prisma.operatorActivity.findMany({
      orderBy: { date: "desc" }, // Urutkan terbaru dulu
    });
  }

  // ===========================
  // 🔹 STATISTICS
  // ===========================
  static async getCustomerStatistics() {
    const [
      totalAssignments,
      uniqueCustomersGroup,
      privateAccounts,
      sharingAccounts,
      vipAccounts,
    ] = await Promise.all([
      prisma.customerAssignment.count(),
      prisma.customerAssignment.groupBy({
        by: ["customerIdentifier"],
        _count: { _all: true },
      }), // Cukup _all
      prisma.customerAssignment.count({ where: { accountType: "private" } }),
      prisma.customerAssignment.count({ where: { accountType: "sharing" } }),
      prisma.customerAssignment.count({ where: { accountType: "vip" } }),
    ]);
    return {
      totalCustomers: uniqueCustomersGroup.length,
      totalAssignments,
      privateAccounts,
      sharingAccounts,
      vipAccounts,
    };
  }

  static async getOperatorStatistics() {
    const activities = await prisma.operatorActivity.findMany({
      orderBy: { date: "asc" },
    });
    type OperatorStats = {
      total: number;
      private: number;
      sharing: number;
      vip: number;
      byDate: Record<string, number>;
    };
    const stats: Record<string, OperatorStats> = {};

    activities.forEach((activity) => {
      const name = activity.operatorName || "Unknown";
      if (!stats[name])
        stats[name] = { total: 0, private: 0, sharing: 0, vip: 0, byDate: {} };
      stats[name].total++;
      if (activity.accountType === "private") stats[name].private++;
      else if (activity.accountType === "sharing") stats[name].sharing++;
      else if (activity.accountType === "vip") stats[name].vip++;
      const activityDate = activity.date;
      if (activityDate) {
        const dateKey = activityDate.toISOString().split("T")[0];
        stats[name].byDate[dateKey] = (stats[name].byDate[dateKey] || 0) + 1;
      } else {
        console.warn(`Activity ${activity.id} has null date.`);
      }
    });
    return stats;
  }
} // <-- Penutup Class DatabaseService
