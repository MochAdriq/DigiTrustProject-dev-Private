// lib/database-service.ts

import { prisma } from "./prisma";
import {
  Prisma,
  AccountType as PrismaAccountType,
  PlatformType as PrismaPlatformType,
} from "@prisma/client";
// Pastikan tipe Profile diimpor dengan benar, sesuaikan path jika perlu
import type { Profile } from "./database.types";

// Definisikan tipe string literal yang sesuai dengan ENUM di Prisma
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
  const profileCounts: Record<AccountType, number> = {
    sharing: 20,
    private: 8,
    vip: 6,
  };
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

  // Pastikan tipe Profile sesuai { profile: string, pin: string, used: boolean }
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
  static async getAllAccounts() {
    return prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAccountsByType(type: AccountType) {
    return prisma.account.findMany({
      where: { type: type as PrismaAccountType },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAccountsByPlatform(platform: PlatformType) {
    return prisma.account.findMany({
      where: { platform: platform as PrismaPlatformType },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAccountByEmail(email: string) {
    return prisma.account.findUnique({ where: { email } });
  }

  static async getAvailableProfileCount(type: AccountType): Promise<number> {
    const accountsOfType = await this.getAccountsByType(type);
    let availableCount = 0;
    accountsOfType.forEach((account) => {
      // Periksa tipe dan struktur profiles dengan aman
      if (Array.isArray(account.profiles)) {
        const profilesArray = account.profiles as unknown as Profile[];
        availableCount += profilesArray.filter(
          (p) => typeof p === "object" && p !== null && !p.used
        ).length;
      }
    });
    return availableCount;
  }

  static async isCustomerIdentifierUsed(
    customerIdentifier: string
  ): Promise<boolean> {
    const assignment = await prisma.customerAssignment.findFirst({
      where: { customerIdentifier: customerIdentifier },
    });
    return !!assignment;
  }

  static async addAccount(data: {
    email: string;
    password: string;
    type: AccountType;
    platform: PlatformType;
    expiresAt?: Date;
  }) {
    // Validasi dasar
    if (!data.email || !data.password || !data.type || !data.platform) {
      throw new Error("Missing required fields for adding account.");
    }
    return prisma.account.create({
      data: {
        email: data.email,
        password: data.password,
        type: data.type as PrismaAccountType,
        platform: data.platform as PrismaPlatformType,
        profiles: generateProfiles(
          data.type
        ) as unknown as Prisma.InputJsonValue,
        expiresAt:
          data.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reported: false,
      },
    });
  }

  static async addMultipleAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt?: Date
  ) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("Accounts array cannot be empty.");
    }
    const defaultExpiresAt =
      expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const dataToInsert = accounts.map((a) => {
      // Validasi setiap akun dalam array
      if (!a.email || !a.password || !a.type || !a.platform) {
        throw new Error(
          `Invalid account data found in array: ${JSON.stringify(a)}`
        );
      }
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

    // Gunakan transaksi untuk memastikan konsistensi jika createMany gagal sebagian (opsional)
    // await prisma.$transaction(async (tx) => {
    //    await tx.account.createMany({ data: dataToInsert, skipDuplicates: true });
    // });
    await prisma.account.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    return prisma.account.findMany({
      where: { email: { in: accounts.map((x) => x.email) } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateAccount(
    id: string,
    data: {
      email?: string;
      password?: string;
      expiresAt?: Date;
      profiles?: Profile[];
      platform?: PlatformType;
    }
  ) {
    const payload: Prisma.AccountUpdateInput = {};

    if (data.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    if (data.expiresAt) payload.expiresAt = data.expiresAt;
    if (data.platform) payload.platform = data.platform as PrismaPlatformType;
    if (data.profiles)
      payload.profiles = data.profiles as unknown as Prisma.InputJsonValue;

    // Pastikan ada data yang diupdate
    if (Object.keys(payload).length === 0) {
      console.warn(`No data provided to update account ${id}.`);
      // Kembalikan data akun saat ini atau null/undefined sesuai kebutuhan
      return prisma.account.findUnique({ where: { id } });
    }

    return prisma.account.update({
      where: { id },
      data: payload,
    });
  }

  static async deleteAccount(id: string) {
    try {
      // Gunakan transaksi untuk memastikan semua relasi terhapus sebelum akun utama
      return await prisma.$transaction(async (tx) => {
        await tx.customerAssignment.deleteMany({ where: { accountId: id } });
        await tx.reportedAccount.deleteMany({ where: { accountId: id } });
        const deletedAccount = await tx.account.delete({ where: { id } });
        return deletedAccount;
      });
    } catch (error: any) {
      console.error(`Error deleting account ${id}:`, error);
      // Cek jika error karena record tidak ditemukan
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Account with ID ${id} not found.`);
      }
      throw new Error(
        `Failed to delete account ${id}. It might be referenced elsewhere or doesn't exist.`
      );
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

  // Fungsi untuk mencari by warrantyDate (tanggal data dimasukkan)
  static async getGaransiAccountsByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.garansiAccount.findMany({
      where: {
        warrantyDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { warrantyDate: "desc" },
    });
  }

  // Fungsi untuk mencari by expiresAt (tanggal kadaluarsa)
  static async getGaransiAccountsByExpiresAt(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.garansiAccount.findMany({
      where: {
        expiresAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { expiresAt: "asc" }, // Urutkan berdasarkan expired terdekat
    });
  }

  // Fungsi untuk menambah akun garansi
  static async addGaransiAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt: Date
  ) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("Garansi accounts array cannot be empty.");
    }
    if (
      !expiresAt ||
      !(expiresAt instanceof Date) ||
      isNaN(expiresAt.getTime())
    ) {
      throw new Error("Invalid or missing expiresAt date.");
    }

    const now = new Date();

    const dataToInsert = accounts.map((a) => {
      if (!a.email || !a.password || !a.type || !a.platform) {
        throw new Error(
          `Invalid garansi account data found in array: ${JSON.stringify(a)}`
        );
      }
      return {
        email: a.email,
        password: a.password,
        type: a.type as PrismaAccountType,
        platform: a.platform as PrismaPlatformType,
        profiles: generateProfiles(a.type) as unknown as Prisma.InputJsonValue,
        expiresAt: expiresAt,
        warrantyDate: now,
        isActive: true, // Asumsi selalu aktif saat ditambahkan
      };
    });

    await prisma.garansiAccount.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    // Mengambil kembali data yang baru saja dimasukkan
    return prisma.garansiAccount.findMany({
      where: { email: { in: accounts.map((x) => x.email) } },
      orderBy: { createdAt: "desc" },
    });
  }

  // ===========================
  // 🔹 REPORTED ACCOUNTS
  // ===========================
  static async getAllReportedAccounts() {
    return prisma.reportedAccount.findMany({
      where: { resolved: false }, // Hanya tampilkan yang belum resolved
      orderBy: { reportedAt: "desc" },
      include: { account: true }, // Sertakan detail akun utama
    });
  }

  static async reportAccount(accountId: string, reason: string) {
    // Validasi input
    if (!accountId || !reason) {
      throw new Error(
        "Account ID and reason are required to report an account."
      );
    }
    // Pastikan akun utama ada sebelum melaporkan
    const accountExists = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!accountExists) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // Gunakan transaksi
    return prisma.$transaction(async (tx) => {
      // 1. Update status 'reported' di akun utama
      await tx.account.update({
        where: { id: accountId },
        data: { reported: true },
      });

      // 2. Buat entri baru di ReportedAccount
      const report = await tx.reportedAccount.create({
        data: {
          accountId,
          reportReason: reason,
        },
      });
      return report;
    });
  }

  static async resolveReport(reportId: string, newPassword?: string) {
    if (!reportId) {
      throw new Error("Report ID is required to resolve a report.");
    }

    // Gunakan transaksi
    return prisma.$transaction(async (tx) => {
      // 1. Cari laporan
      const report = await tx.reportedAccount.findUnique({
        where: { id: reportId },
        select: { accountId: true, resolved: true }, // Hanya ambil field yang perlu
      });
      if (!report) throw new Error(`Report with ID ${reportId} not found.`);
      if (report.resolved) {
        console.warn(`Report ${reportId} is already resolved.`);
        return; // Atau throw error jika tidak boleh resolve ulang
      }

      // 2. Update status 'resolved' di laporan
      await tx.reportedAccount.update({
        where: { id: reportId },
        data: { resolved: true },
      });

      // 3. Update akun utama: reset 'reported' dan update password jika ada
      const accountUpdateData: Prisma.AccountUpdateInput = { reported: false };
      if (newPassword) {
        accountUpdateData.password = newPassword;
      }
      await tx.account.update({
        where: { id: report.accountId },
        data: accountUpdateData,
      });

      console.log(
        `Report ${reportId} resolved. Account ${report.accountId} updated.`
      );
    });
  }

  // ===========================
  // 🔹 CUSTOMER ASSIGNMENTS
  // ===========================
  static async getAllCustomerAssignments() {
    return prisma.customerAssignment.findMany({
      orderBy: { assignedAt: "desc" },
      include: { account: true }, // Sertakan detail akun
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
      throw new Error("Missing required fields for customer assignment.");
    }
    const operator = data.operatorName ?? "System"; // Default operator

    // Gunakan transaksi
    return prisma.$transaction(async (tx) => {
      // 1. Buat assignment baru
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

      // 2. Catat aktivitas operator
      await tx.operatorActivity.create({
        data: {
          operatorName: operator,
          action: `Assign profile ${data.profileName} (${data.accountType}) to ${data.customerIdentifier}`,
          accountEmail: data.accountEmail,
          accountType: data.accountType as PrismaAccountType,
        },
      });

      // 3. Update status 'used' di profil akun utama
      try {
        const account = await tx.account.findUnique({
          where: { id: data.accountId },
        });
        if (account && Array.isArray(account.profiles)) {
          const profilesArray = account.profiles as unknown as Profile[];
          const profileIndex = profilesArray.findIndex(
            (p) =>
              typeof p === "object" &&
              p !== null &&
              typeof p.profile === "string" &&
              p.profile === data.profileName &&
              !p.used // Hanya update jika belum used
          );

          if (profileIndex !== -1) {
            const updatedProfiles = [...profilesArray];
            const targetProfile = updatedProfiles[profileIndex];
            if (typeof targetProfile === "object" && targetProfile !== null) {
              updatedProfiles[profileIndex] = { ...targetProfile, used: true };
              await tx.account.update({
                where: { id: data.accountId },
                data: {
                  profiles: updatedProfiles as unknown as Prisma.InputJsonValue,
                },
              });
              console.log(
                `Marked profile ${data.profileName} for account ${data.accountId} as used.`
              );
            }
          } else {
            console.warn(
              `Profile ${data.profileName} not found or already used for account ${data.accountId}.`
            );
          }
        }
      } catch (profileUpdateError) {
        console.error(
          `Failed to mark profile for assignment ${assignment.id}:`,
          profileUpdateError
        );
        // Pertimbangkan apakah transaksi harus dibatalkan jika update profil gagal
        // throw profileUpdateError; // Batalkan transaksi
      }

      return assignment; // Kembalikan data assignment yang baru dibuat
    });
  }

  // ===========================
  // 🔹 OPERATOR ACTIVITIES
  // ===========================
  static async getAllOperatorActivities() {
    return prisma.operatorActivity.findMany({
      orderBy: { date: "desc" },
    });
  }

  // ===========================
  // 🔹 STATISTICS
  // ===========================
  static async getCustomerStatistics() {
    const totalAssignments = await prisma.customerAssignment.count();
    const uniqueCustomersGroup = await prisma.customerAssignment.groupBy({
      by: ["customerIdentifier"],
      _count: { customerIdentifier: true },
    });
    const uniqueCustomerCount = uniqueCustomersGroup.length;
    const privateAccounts = await prisma.customerAssignment.count({
      where: { accountType: "private" as PrismaAccountType },
    });
    const sharingAccounts = await prisma.customerAssignment.count({
      where: { accountType: "sharing" as PrismaAccountType },
    });
    const vipAccounts = await prisma.customerAssignment.count({
      where: { accountType: "vip" as PrismaAccountType },
    });

    return {
      totalCustomers: uniqueCustomerCount,
      totalAssignments,
      privateAccounts,
      sharingAccounts,
      vipAccounts,
    };
  }

  static async getOperatorStatistics() {
    const activities = await prisma.operatorActivity.findMany({
      orderBy: { date: "asc" }, // Urutkan asc untuk pemrosesan byDate
    });

    type OperatorStats = {
      total: number;
      private: number;
      sharing: number;
      vip: number;
      byDate: Record<string, number>; // YYYY-MM-DD
    };
    const stats: Record<string, OperatorStats> = {};

    activities.forEach((activity) => {
      // Pastikan operatorName tidak null atau undefined
      const name = activity.operatorName || "Unknown";
      if (!stats[name]) {
        stats[name] = { total: 0, private: 0, sharing: 0, vip: 0, byDate: {} };
      }

      stats[name].total++;
      if (activity.accountType === "private") stats[name].private++;
      else if (activity.accountType === "sharing") stats[name].sharing++;
      else if (activity.accountType === "vip") stats[name].vip++;

      // Handle jika tanggal null/undefined (seharusnya tidak terjadi jika @default(now()))
      const activityDate = activity.date;
      if (activityDate) {
        const dateKey = activityDate.toISOString().split("T")[0];
        stats[name].byDate[dateKey] = (stats[name].byDate[dateKey] || 0) + 1;
      } else {
        console.warn(`Activity ${activity.id} has a null date.`);
      }
    });

    return stats;
  }
} // <-- Penutup Class DatabaseService
