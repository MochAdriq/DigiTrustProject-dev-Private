// lib/database-service.ts

import { prisma } from "./prisma";
import {
  Prisma,
  AccountType as PrismaAccountType,
  PlatformType as PrismaPlatformType,
} from "@prisma/client";
import type { Profile } from "./database.types";

export type AccountType = "private" | "sharing" | "vip";
export type PlatformType =
  | "VIDIO_DIAMOND_MOBILE"
  | "VIU_1_BULAN"
  | "WE_TV"
  | "YT_1_BULAN"
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
  | "NETFLIX";

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

  static async addAccount(data: {
    email: string;
    password: string;
    type: AccountType;
    platform: PlatformType;
    expiresAt?: Date;
  }) {
    return prisma.account.create({
      data: {
        email: data.email,
        password: data.password,
        type: data.type as PrismaAccountType,
        platform: data.platform as PrismaPlatformType,
        profiles: generateProfiles(
          data.type
        ) as unknown as Prisma.InputJsonValue,
        createdAt: new Date(),
        expiresAt: data.expiresAt ?? new Date(),
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
    const now = new Date();

    const dataToInsert = accounts.map((a) => ({
      email: a.email,
      password: a.password,
      type: a.type as PrismaAccountType,
      platform: a.platform as PrismaPlatformType,
      profiles: generateProfiles(a.type) as unknown as Prisma.InputJsonValue,
      createdAt: now,
      expiresAt: expiresAt ?? now,
      reported: false,
    }));

    await prisma.account.createMany({ data: dataToInsert });

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
    const payload: any = { ...data };

    if (data.profiles)
      payload.profiles = data.profiles as unknown as Prisma.InputJsonValue;
    if (data.platform) payload.platform = data.platform as PrismaPlatformType;

    return prisma.account.update({
      where: { id },
      data: payload,
    });
  }

  static async deleteAccount(id: string) {
    return prisma.account.delete({ where: { id } });
  }

  // ===========================
  // 🔹 GARANSI ACCOUNTS
  // ===========================
  static async getAllGaransiAccounts() {
    return prisma.garansiAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async addGaransiAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    warrantyDate: Date,
    expiresAt?: Date
  ) {
    const dataToInsert = accounts.map((a) => ({
      email: a.email,
      password: a.password,
      type: a.type as PrismaAccountType,
      platform: a.platform as PrismaPlatformType,
      profiles: generateProfiles(a.type) as unknown as Prisma.InputJsonValue,
      createdAt: new Date(),
      expiresAt: expiresAt ?? new Date(),
      warrantyDate,
      isActive: true,
    }));

    await prisma.garansiAccount.createMany({ data: dataToInsert });

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
      where: { resolved: false },
      orderBy: { reportedAt: "desc" },
      include: { account: true },
    });
  }

  static async reportAccount(accountId: string, reason: string) {
    await prisma.account.update({
      where: { id: accountId },
      data: { reported: true },
    });

    return prisma.reportedAccount.create({
      data: {
        accountId,
        reportReason: reason,
      },
    });
  }

  static async resolveReport(reportId: string, newPassword?: string) {
    const report = await prisma.reportedAccount.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new Error("Report not found");

    await prisma.reportedAccount.update({
      where: { id: reportId },
      data: { resolved: true },
    });

    if (newPassword) {
      await prisma.account.update({
        where: { id: report.accountId },
        data: {
          password: newPassword,
          reported: false,
        },
      });
    }
  }

  // ===========================
  // 🔹 CUSTOMER ASSIGNMENTS
  // ===========================
  static async getAllCustomerAssignments() {
    return prisma.customerAssignment.findMany({
      orderBy: { assignedAt: "desc" },
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
    const assignment = await prisma.customerAssignment.create({
      data: {
        ...data,
        accountType: data.accountType as PrismaAccountType,
      },
    });

    await prisma.operatorActivity.create({
      data: {
        operatorName: data.operatorName ?? "Unknown",
        action: "Request Account",
        accountEmail: data.accountEmail,
        accountType: data.accountType as PrismaAccountType,
      },
    });

    return assignment;
  }

  // ===========================
  // 🔹 STATISTICS
  // ===========================
  static async getCustomerStatistics() {
    const totalAssignments = await prisma.customerAssignment.count();
    const uniqueCustomers = await prisma.customerAssignment.groupBy({
      by: ["customerIdentifier"],
    });
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
      totalCustomers: uniqueCustomers.length,
      totalAssignments,
      privateAccounts,
      sharingAccounts,
      vipAccounts,
    };
  }

  static async getOperatorStatistics() {
    const activities = await prisma.operatorActivity.findMany();
    const stats: Record<
      string,
      {
        total: number;
        private: number;
        sharing: number;
        vip: number;
        byDate: Record<string, number>;
      }
    > = {};

    activities.forEach((activity) => {
      const name = activity.operatorName;
      if (!stats[name]) {
        stats[name] = {
          total: 0,
          private: 0,
          sharing: 0,
          vip: 0,
          byDate: {},
        };
      }

      stats[name].total++;
      if (activity.accountType === ("private" as PrismaAccountType))
        stats[name].private++;
      else if (activity.accountType === ("sharing" as PrismaAccountType))
        stats[name].sharing++;
      else if (activity.accountType === ("vip" as PrismaAccountType))
        stats[name].vip++;

      const date = new Date(activity.date).toLocaleDateString("id-ID");
      stats[name].byDate[date] = (stats[name].byDate[date] || 0) + 1;
    });

    return stats;
  }
}
