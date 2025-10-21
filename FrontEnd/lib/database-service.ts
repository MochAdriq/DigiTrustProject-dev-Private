// // import { prisma } from "./prisma";
// import type { Profile } from "./database.types";
// export type AccountType = "private" | "sharing" | "vip";

// export interface Account {
//   id: string;
//   email: string;
//   password: string;
//   type: "private" | "sharing";
//   profiles: Profile[];
//   createdAt: Date;
//   expiresAt: Date;
//   reported?: boolean;
//   reportReason?: string;
//   isGaransiOnly?: boolean;
// }

// export interface GaransiAccount {
//   id: string;
//   email: string;
//   password: string;
//   type: "private" | "sharing";
//   profiles: Profile[];
//   createdAt: Date;
//   expiresAt: Date;
//   warrantyDate: Date;
// }

// export interface ReportedAccount {
//   id: string;
//   accountId: string;
//   email: string;
//   reportReason: string;
//   reportedAt: Date;
//   resolved: boolean;
// }

// export interface CustomerAssignment {
//   id: string;
//   customerIdentifier: string;
//   accountId: string;
//   accountEmail: string;
//   accountType: string;
//   profileName: string;
//   operatorName?: string | null;
//   assignedAt: Date;
// }

// export interface OperatorActivity {
//   id: string;
//   operatorName: string;
//   action: string;
//   accountEmail: string;
//   accountType: string;
//   date: Date;
// }

// // Helper function to calculate expiration date (23 days from creation)
// const calculateExpirationDate = (creationDate: Date): Date => {
//   const expirationDate = new Date(creationDate);
//   expirationDate.setDate(expirationDate.getDate() + 23);
//   return expirationDate;
// };

// // Helper function to generate profiles
// const generateProfiles = (
//   type: "private" | "sharing",
//   customCount?: number
// ): Profile[] => {
//   const defaultCount = type === "private" ? 8 : 20;
//   const count = customCount || defaultCount;
//   const profiles: Profile[] = [];

//   const profilePatterns = [
//     { profile: "Profile A", pin: "1111" },
//     { profile: "Profile B", pin: "2222" },
//     { profile: "Profile C", pin: "3333" },
//     { profile: "Profile D", pin: "4444" },
//     { profile: "Profile E", pin: "5555" },
//     { profile: "Profile F", pin: "6666" },
//     { profile: "Profile G", pin: "7777" },
//     { profile: "Profile H", pin: "8888" },
//     { profile: "Profile I", pin: "9999" },
//     { profile: "Profile J", pin: "0000" },
//     { profile: "Profile K", pin: "1234" },
//     { profile: "Profile L", pin: "5678" },
//     { profile: "Profile M", pin: "9012" },
//     { profile: "Profile N", pin: "3456" },
//     { profile: "Profile O", pin: "7890" },
//     { profile: "Profile P", pin: "2468" },
//     { profile: "Profile Q", pin: "1357" },
//     { profile: "Profile R", pin: "9753" },
//     { profile: "Profile S", pin: "8642" },
//     { profile: "Profile T", pin: "1470" },
//   ];

//   for (let i = 0; i < count; i++) {
//     const patternIndex = i % profilePatterns.length;
//     profiles.push({
//       ...profilePatterns[patternIndex],
//       used: false,
//     });
//   }

//   return profiles;
// };

// export class DatabaseService {
//   // Account operations
//   static async getAllAccounts(): Promise<Account[]> {
//     try {
//       const accounts = await prisma.account.findMany({
//         where: { isGaransiOnly: false },
//         orderBy: { createdAt: "desc" },
//       });

//       return accounts.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       }));
//     } catch (error) {
//       console.error("Error fetching accounts:", error);
//       throw error;
//     }
//   }

//   static async getAccountsByType(
//     type: "private" | "sharing"
//   ): Promise<Account[]> {
//     try {
//       const accounts = await prisma.account.findMany({
//         where: {
//           type,
//           isGaransiOnly: false,
//         },
//         orderBy: { createdAt: "desc" },
//       });

//       return accounts.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       }));
//     } catch (error) {
//       console.error("Error fetching accounts by type:", error);
//       throw error;
//     }
//   }

//   static async getAccountByEmail(email: string): Promise<Account | null> {
//     try {
//       const account = await prisma.account.findUnique({
//         where: { email },
//       });

//       if (!account) return null;

//       return {
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       };
//     } catch (error) {
//       console.error("Error fetching account by email:", error);
//       throw error;
//     }
//   }

//   static async addAccount(data: {
//     email: string;
//     password: string;
//     type: "private" | "sharing";
//     profiles?: Profile[];
//   }): Promise<Account> {
//     try {
//       const creationDate = new Date();
//       const profiles = data.profiles || generateProfiles(data.type);

//       const account = await prisma.account.create({
//         data: {
//           email: data.email,
//           password: data.password,
//           type: data.type,
//           profiles: profiles as any,
//           createdAt: creationDate,
//           expiresAt: calculateExpirationDate(creationDate),
//           isGaransiOnly: false,
//         },
//       });

//       return {
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       };
//     } catch (error) {
//       console.error("Error adding account:", error);
//       throw error;
//     }
//   }

//   static async addMultipleAccounts(
//     accounts: {
//       email: string;
//       password: string;
//       type: "private" | "sharing";
//       profileCount?: number;
//     }[]
//   ): Promise<Account[]> {
//     try {
//       const creationDate = new Date();

//       const accountsData = accounts.map((account) => ({
//         email: account.email,
//         password: account.password,
//         type: account.type,
//         profiles: generateProfiles(account.type, account.profileCount) as any,
//         createdAt: creationDate,
//         expiresAt: calculateExpirationDate(creationDate),
//         isGaransiOnly: false,
//       }));

//       const createdAccounts = await prisma.account.createMany({
//         data: accountsData,
//       });

//       // Fetch the created accounts
//       const result = await prisma.account.findMany({
//         where: {
//           email: { in: accounts.map((a) => a.email) },
//         },
//         orderBy: { createdAt: "desc" },
//       });

//       return result.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       }));
//     } catch (error) {
//       console.error("Error adding multiple accounts:", error);
//       throw error;
//     }
//   }

//   static async updateAccount(
//     id: string,
//     data: {
//       email?: string;
//       password?: string;
//       expiresAt?: Date;
//       profiles?: Profile[];
//     }
//   ): Promise<Account> {
//     try {
//       const account = await prisma.account.update({
//         where: { id },
//         data: {
//           ...data,
//           profiles: data.profiles as any,
//         },
//       });

//       return {
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//       };
//     } catch (error) {
//       console.error("Error updating account:", error);
//       throw error;
//     }
//   }

//   static async deleteAccount(id: string): Promise<void> {
//     try {
//       await prisma.account.delete({
//         where: { id },
//       });
//     } catch (error) {
//       console.error("Error deleting account:", error);
//       throw error;
//     }
//   }

//   // Garansi Account operations
//   static async getAllGaransiAccounts(): Promise<GaransiAccount[]> {
//     try {
//       const accounts = await prisma.garansiAccount.findMany({
//         orderBy: { createdAt: "desc" },
//       });

//       return accounts.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//         warrantyDate: account.warrantyDate,
//       }));
//     } catch (error) {
//       console.error("Error fetching garansi accounts:", error);
//       throw error;
//     }
//   }

//   static async getGaransiAccountsByDate(date: Date): Promise<GaransiAccount[]> {
//     try {
//       const startOfDay = new Date(date);
//       startOfDay.setHours(0, 0, 0, 0);

//       const endOfDay = new Date(date);
//       endOfDay.setHours(23, 59, 59, 999);

//       const accounts = await prisma.garansiAccount.findMany({
//         where: {
//           warrantyDate: {
//             gte: startOfDay,
//             lte: endOfDay,
//           },
//         },
//         orderBy: { createdAt: "desc" },
//       });

//       return accounts.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//         warrantyDate: account.warrantyDate,
//       }));
//     } catch (error) {
//       console.error("Error fetching garansi accounts by date:", error);
//       throw error;
//     }
//   }

//   static async addGaransiAccounts(
//     accounts: {
//       email: string;
//       password: string;
//       type: "private" | "sharing";
//     }[],
//     warrantyDate: Date
//   ): Promise<GaransiAccount[]> {
//     try {
//       const creationDate = warrantyDate;

//       const accountsData = accounts.map((account) => ({
//         email: account.email,
//         password: account.password,
//         type: account.type,
//         profiles: generateProfiles(account.type) as any,
//         createdAt: creationDate,
//         expiresAt: calculateExpirationDate(creationDate),
//         warrantyDate: warrantyDate,
//       }));

//       await prisma.garansiAccount.createMany({
//         data: accountsData,
//       });

//       // Fetch the created accounts
//       const result = await prisma.garansiAccount.findMany({
//         where: {
//           email: { in: accounts.map((a) => a.email) },
//         },
//         orderBy: { createdAt: "desc" },
//       });

//       return result.map((account) => ({
//         ...account,
//         profiles: account.profiles as Profile[],
//         createdAt: account.createdAt,
//         expiresAt: account.expiresAt,
//         warrantyDate: account.warrantyDate,
//       }));
//     } catch (error) {
//       console.error("Error adding garansi accounts:", error);
//       throw error;
//     }
//   }

//   // Reported Account operations
//   static async getAllReportedAccounts(): Promise<ReportedAccount[]> {
//     try {
//       const reports = await prisma.reportedAccount.findMany({
//         where: { resolved: false },
//         orderBy: { reportedAt: "desc" },
//       });

//       return reports.map((report) => ({
//         ...report,
//         reportedAt: report.reportedAt,
//       }));
//     } catch (error) {
//       console.error("Error fetching reported accounts:", error);
//       throw error;
//     }
//   }

//   static async reportAccount(
//     accountId: string,
//     email: string,
//     reason: string
//   ): Promise<ReportedAccount> {
//     try {
//       // Mark account as reported
//       await prisma.account.update({
//         where: { id: accountId },
//         data: {
//           reported: true,
//           reportReason: reason,
//         },
//       });

//       // Create report record
//       const report = await prisma.reportedAccount.create({
//         data: {
//           accountId,
//           email,
//           reportReason: reason,
//         },
//       });

//       return {
//         ...report,
//         reportedAt: report.reportedAt,
//       };
//     } catch (error) {
//       console.error("Error reporting account:", error);
//       throw error;
//     }
//   }

//   static async resolveReport(
//     reportId: string,
//     newPassword?: string
//   ): Promise<void> {
//     try {
//       const report = await prisma.reportedAccount.findUnique({
//         where: { id: reportId },
//       });

//       if (!report) throw new Error("Report not found");

//       // Mark report as resolved
//       await prisma.reportedAccount.update({
//         where: { id: reportId },
//         data: { resolved: true },
//       });

//       // Update account if new password provided
//       if (newPassword) {
//         await prisma.account.update({
//           where: { id: report.accountId },
//           data: {
//             password: newPassword,
//             reported: false,
//             reportReason: null,
//           },
//         });
//       }
//     } catch (error) {
//       console.error("Error resolving report:", error);
//       throw error;
//     }
//   }

//   // Customer Assignment operations
//   static async getAllCustomerAssignments(): Promise<CustomerAssignment[]> {
//     try {
//       const assignments = await prisma.customerAssignment.findMany({
//         orderBy: { assignedAt: "desc" },
//       });

//       return assignments.map((assignment) => ({
//         ...assignment,
//         assignedAt: assignment.assignedAt,
//       }));
//     } catch (error) {
//       console.error("Error fetching customer assignments:", error);
//       throw error;
//     }
//   }

//   static async addCustomerAssignment(data: {
//     customerIdentifier: string;
//     accountId: string;
//     accountEmail: string;
//     accountType: string;
//     profileName: string;
//     operatorName?: string;
//   }): Promise<CustomerAssignment> {
//     try {
//       const assignment = await prisma.customerAssignment.create({
//         data,
//       });

//       // Add operator activity
//       await prisma.operatorActivity.create({
//         data: {
//           operatorName: data.operatorName || "Unknown",
//           action: "Request Account",
//           accountEmail: data.accountEmail,
//           accountType: data.accountType,
//         },
//       });

//       return {
//         ...assignment,
//         assignedAt: assignment.assignedAt,
//       };
//     } catch (error) {
//       console.error("Error adding customer assignment:", error);
//       throw error;
//     }
//   }

//   static async isCustomerIdentifierUsed(
//     customerIdentifier: string
//   ): Promise<boolean> {
//     try {
//       const count = await prisma.customerAssignment.count({
//         where: {
//           customerIdentifier: {
//             equals: customerIdentifier,
//             mode: "insensitive",
//           },
//         },
//       });

//       return count > 0;
//     } catch (error) {
//       console.error("Error checking customer identifier:", error);
//       throw error;
//     }
//   }

//   // Operator Activity operations
//   static async getAllOperatorActivities(): Promise<OperatorActivity[]> {
//     try {
//       const activities = await prisma.operatorActivity.findMany({
//         orderBy: { date: "desc" },
//       });

//       return activities.map((activity) => ({
//         ...activity,
//         date: activity.date,
//       }));
//     } catch (error) {
//       console.error("Error fetching operator activities:", error);
//       throw error;
//     }
//   }

//   // Statistics
//   static async getCustomerStatistics() {
//     try {
//       const totalAssignments = await prisma.customerAssignment.count();
//       const uniqueCustomers = await prisma.customerAssignment.groupBy({
//         by: ["customerIdentifier"],
//       });
//       const privateAccounts = await prisma.customerAssignment.count({
//         where: { accountType: "private" },
//       });
//       const sharingAccounts = await prisma.customerAssignment.count({
//         where: { accountType: "sharing" },
//       });

//       return {
//         totalCustomers: uniqueCustomers.length,
//         totalAssignments,
//         privateAccounts,
//         sharingAccounts,
//       };
//     } catch (error) {
//       console.error("Error fetching customer statistics:", error);
//       throw error;
//     }
//   }

//   static async getOperatorStatistics() {
//     try {
//       const activities = await prisma.operatorActivity.findMany();

//       const stats: {
//         [operator: string]: {
//           total: number;
//           private: number;
//           sharing: number;
//           byDate: { [date: string]: number };
//         };
//       } = {};

//       activities.forEach((activity) => {
//         if (!stats[activity.operatorName]) {
//           stats[activity.operatorName] = {
//             total: 0,
//             private: 0,
//             sharing: 0,
//             byDate: {},
//           };
//         }

//         stats[activity.operatorName].total++;

//         if (activity.accountType === "private") {
//           stats[activity.operatorName].private++;
//         } else {
//           stats[activity.operatorName].sharing++;
//         }

//         const date = activity.date.toLocaleDateString("id-ID");
//         if (!stats[activity.operatorName].byDate[date]) {
//           stats[activity.operatorName].byDate[date] = 0;
//         }
//         stats[activity.operatorName].byDate[date]++;
//       });

//       return stats;
//     } catch (error) {
//       console.error("Error fetching operator statistics:", error);
//       throw error;
//     }
//   }

//   static async getAvailableProfileCount(
//     type: "private" | "sharing"
//   ): Promise<number> {
//     try {
//       const accounts = await prisma.account.findMany({
//         where: {
//           type,
//           isGaransiOnly: false,
//         },
//       });

//       return accounts.reduce((count, account) => {
//         const profiles = account.profiles as Profile[];
//         return count + profiles.filter((profile) => !profile.used).length;
//       }, 0);
//     } catch (error) {
//       console.error("Error fetching available profile count:", error);
//       throw error;
//     }
//   }

//   // User management
//   static async createUser(
//     username: string,
//     password: string,
//     role = "operator"
//   ) {
//     try {
//       const user = await prisma.user.create({
//         data: {
//           username,
//           password, // In production, hash this password
//           role,
//         },
//       });

//       return user;
//     } catch (error) {
//       console.error("Error creating user:", error);
//       throw error;
//     }
//   }

//   static async getUserByUsername(username: string) {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { username },
//       });

//       return user;
//     } catch (error) {
//       console.error("Error fetching user:", error);
//       throw error;
//     }
//   }
// }

// import { prisma } from "./prisma"; // Komentari atau hapus impor prisma

// Definisikan tipe dan interface yang dibutuhkan (atau impor jika sudah ada di tempat lain)
export type AccountType = "private" | "sharing" | "vip";

export interface Profile {
  profile: string;
  pin: string;
  used: boolean;
}

export interface Account {
  id: string;
  email: string;
  password: string;
  type: AccountType;
  profiles: Profile[];
  createdAt: Date;
  expiresAt: Date;
  reported?: boolean;
  reportReason?: string | null; // Nullable agar sesuai schema
  isGaransiOnly?: boolean;
}

export interface GaransiAccount {
  id: string;
  email: string;
  password: string;
  type: AccountType; // Bisa private/sharing/vip juga jika perlu
  profiles: Profile[];
  createdAt: Date;
  expiresAt: Date;
  warrantyDate: Date;
}

export interface ReportedAccount {
  id: string;
  accountId: string;
  email: string;
  reportReason: string;
  reportedAt: Date;
  resolved: boolean;
}

export interface CustomerAssignment {
  id: string;
  customerIdentifier: string;
  accountId: string;
  accountEmail: string;
  accountType: AccountType; // Gunakan AccountType
  profileName: string;
  operatorName?: string | null; // Nullable agar sesuai schema
  assignedAt: Date;
}

export interface OperatorActivity {
  id: string;
  operatorName: string;
  action: string;
  accountEmail: string;
  accountType: AccountType; // Gunakan AccountType
  date: Date;
}

// Helper functions (tetap bisa digunakan)
const calculateExpirationDate = (creationDate: Date): Date => {
  const expirationDate = new Date(creationDate);
  expirationDate.setDate(expirationDate.getDate() + 23);
  return expirationDate;
};

const generateProfiles = (
  type: AccountType,
  customCount?: number
): Profile[] => {
  const defaultCounts = { private: 8, sharing: 20, vip: 5 };
  const count = customCount || defaultCounts[type] || 8;
  const profiles: Profile[] = [];
  const profilePatterns = Array.from({ length: 20 }, (_, i) => ({
    profile: `Profile ${String.fromCharCode(65 + i)}`,
    pin: `${(i + 1).toString().padStart(4, "0")}`,
    used: false,
  }));
  for (let i = 0; i < count; i++) {
    profiles.push({ ...profilePatterns[i % profilePatterns.length] });
  }
  return profiles;
};

// --- Mock Data Store (Simulasi Database di Memori) ---
let mockAccounts: Account[] = [
  {
    id: "mock-priv-1",
    email: "mock.private1@example.com",
    password: "password",
    type: "private",
    profiles: generateProfiles("private").map((p, i) => ({
      ...p,
      used: i < 2,
    })),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: calculateExpirationDate(
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    ),
    isGaransiOnly: false,
    reported: false,
    reportReason: null,
  },
  {
    id: "mock-shar-1",
    email: "mock.sharing1@example.com",
    password: "password",
    type: "sharing",
    profiles: generateProfiles("sharing").map((p, i) => ({
      ...p,
      used: i < 5,
    })),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: calculateExpirationDate(
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    ),
    isGaransiOnly: false,
    reported: false,
    reportReason: null,
  },
  {
    id: "mock-vip-1",
    email: "mock.vip1@example.com",
    password: "password",
    type: "vip",
    profiles: generateProfiles("vip").map((p, i) => ({ ...p, used: i < 1 })),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: calculateExpirationDate(
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    ),
    isGaransiOnly: false,
    reported: true,
    reportReason: "Password salah",
  },
  {
    id: "mock-priv-2",
    email: "mock.private2.expired@example.com",
    password: "password",
    type: "private",
    profiles: generateProfiles("private"),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: calculateExpirationDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ),
    isGaransiOnly: false,
    reported: false,
    reportReason: null,
  },
];

let mockGaransiAccounts: GaransiAccount[] = [
  {
    id: "mock-garansi-1",
    email: "garansi.priv@example.com",
    password: "password",
    type: "private",
    profiles: generateProfiles("private"),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: calculateExpirationDate(
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    ),
    warrantyDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

let mockReportedAccounts: ReportedAccount[] = [
  {
    id: "rep-1",
    accountId: "mock-vip-1",
    email: "mock.vip1@example.com",
    reportReason: "Password salah",
    reportedAt: new Date(Date.now() - 60 * 60 * 1000),
    resolved: false,
  },
];

let mockCustomerAssignments: CustomerAssignment[] = [
  {
    id: "assign-1",
    customerIdentifier: "081234567890",
    accountId: "mock-priv-1",
    accountEmail: "mock.private1@example.com",
    accountType: "private",
    profileName: "Profile B",
    operatorName: "Operator 1",
    assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "assign-2",
    customerIdentifier: "Budi Customer",
    accountId: "mock-shar-1",
    accountEmail: "mock.sharing1@example.com",
    accountType: "sharing",
    profileName: "Profile C",
    operatorName: "Admin",
    assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

let mockOperatorActivities: OperatorActivity[] = [
  {
    id: "act-1",
    operatorName: "Operator 1",
    action: "Request Account",
    accountEmail: "mock.private1@example.com",
    accountType: "private",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "act-2",
    operatorName: "Admin",
    action: "Request Account",
    accountEmail: "mock.sharing1@example.com",
    accountType: "sharing",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "act-3",
    operatorName: "Admin",
    action: "Add Account",
    accountEmail: "mock.vip1@example.com",
    accountType: "vip",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// --- Mock Database Service ---
export class DatabaseService {
  static async _simulateDelay(ms: number = 150) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // == Account operations ==
  static async getAllAccounts(): Promise<Account[]> {
    console.log("⚠️ MOCK DATA: getAllAccounts()");
    await this._simulateDelay();
    // Filter hanya akun yang bukan garansi (jika ada flagnya)
    return Promise.resolve(mockAccounts.filter((acc) => !acc.isGaransiOnly));
  }

  static async getAccountsByType(type: AccountType): Promise<Account[]> {
    console.log(`⚠️ MOCK DATA: getAccountsByType(${type})`);
    await this._simulateDelay();
    return Promise.resolve(
      mockAccounts.filter((acc) => acc.type === type && !acc.isGaransiOnly)
    );
  }

  static async getAccountByEmail(email: string): Promise<Account | null> {
    console.log(`⚠️ MOCK DATA: getAccountByEmail(${email})`);
    await this._simulateDelay();
    const account = mockAccounts.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    );
    return Promise.resolve(account || null);
  }

  static async addAccount(data: {
    email: string;
    password: string;
    type: AccountType;
    profiles?: Profile[]; // Profiles opsional, akan digenerate jika tidak ada
  }): Promise<Account> {
    console.log("⚠️ MOCK DATA: addAccount()", data);
    await this._simulateDelay(300);
    const creationDate = new Date();
    const newAccount: Account = {
      id: `mock-${Date.now()}`,
      email: data.email,
      password: data.password,
      type: data.type,
      profiles: data.profiles || generateProfiles(data.type),
      createdAt: creationDate,
      expiresAt: calculateExpirationDate(creationDate),
      isGaransiOnly: false, // Akun baru pasti bukan garansi
      reported: false,
      reportReason: null,
    };
    mockAccounts.push(newAccount);
    return Promise.resolve(newAccount);
  }

  static async addMultipleAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      profileCount?: number;
    }[]
  ): Promise<Account[]> {
    console.log("⚠️ MOCK DATA: addMultipleAccounts()", accounts);
    await this._simulateDelay(500);
    const addedAccounts: Account[] = [];
    const creationDate = new Date();
    for (const accData of accounts) {
      const newAccount: Account = {
        id: `mock-${accData.email.substring(0, 5)}-${Date.now()}`,
        email: accData.email,
        password: accData.password,
        type: accData.type,
        profiles: generateProfiles(accData.type, accData.profileCount),
        createdAt: creationDate,
        expiresAt: calculateExpirationDate(creationDate),
        isGaransiOnly: false,
        reported: false,
        reportReason: null,
      };
      mockAccounts.push(newAccount);
      addedAccounts.push(newAccount);
    }
    return Promise.resolve(addedAccounts);
  }

  static async updateAccount(
    id: string,
    data: {
      email?: string;
      password?: string;
      expiresAt?: Date;
      profiles?: Profile[];
    }
  ): Promise<Account> {
    console.log(`⚠️ MOCK DATA: updateAccount(${id})`, data);
    await this._simulateDelay();
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === id);
    if (accountIndex === -1) {
      throw new Error(`Mock account with id ${id} not found`);
    }
    // Update data
    if (data.email) mockAccounts[accountIndex].email = data.email;
    if (data.password) mockAccounts[accountIndex].password = data.password;
    if (data.expiresAt) mockAccounts[accountIndex].expiresAt = data.expiresAt;
    if (data.profiles) mockAccounts[accountIndex].profiles = data.profiles;

    return Promise.resolve(mockAccounts[accountIndex]);
  }

  static async deleteAccount(id: string): Promise<void> {
    console.log(`⚠️ MOCK DATA: deleteAccount(${id})`);
    await this._simulateDelay();
    mockAccounts = mockAccounts.filter((acc) => acc.id !== id);
    mockCustomerAssignments = mockCustomerAssignments.filter(
      (a) => a.accountId !== id
    );
    mockReportedAccounts = mockReportedAccounts.filter(
      (r) => r.accountId !== id
    );
    return Promise.resolve();
  }

  static async getAllGaransiAccounts(): Promise<GaransiAccount[]> {
    console.log("⚠️ MOCK DATA: getAllGaransiAccounts()");
    await this._simulateDelay();
    return Promise.resolve([...mockGaransiAccounts]);
  }

  static async getGaransiAccountsByDate(date: Date): Promise<GaransiAccount[]> {
    console.log(
      `⚠️ MOCK DATA: getGaransiAccountsByDate(${
        date.toISOString().split("T")[0]
      })`
    );
    await this._simulateDelay();
    const targetDateStr = date.toISOString().split("T")[0];
    const filtered = mockGaransiAccounts.filter(
      (acc) => acc.warrantyDate.toISOString().split("T")[0] === targetDateStr
    );
    return Promise.resolve(filtered);
  }

  static async addGaransiAccounts(
    accounts: {
      email: string;
      password: string;
      type: AccountType;
    }[],
    warrantyDate: Date
  ): Promise<GaransiAccount[]> {
    console.log("⚠️ MOCK DATA: addGaransiAccounts()", accounts, warrantyDate);
    await this._simulateDelay(400);
    const addedGaransi: GaransiAccount[] = [];
    for (const accData of accounts) {
      const creationDate = warrantyDate;
      const newGaransi: GaransiAccount = {
        id: `mock-garansi-${accData.email.substring(0, 5)}-${Date.now()}`,
        email: accData.email,
        password: accData.password,
        type: accData.type,
        profiles: generateProfiles(accData.type),
        createdAt: creationDate,
        expiresAt: calculateExpirationDate(creationDate),
        warrantyDate: warrantyDate,
      };
      mockGaransiAccounts.push(newGaransi);
      addedGaransi.push(newGaransi);
    }
    return Promise.resolve(addedGaransi);
  }

  static async getAllReportedAccounts(): Promise<ReportedAccount[]> {
    console.log("⚠️ MOCK DATA: getAllReportedAccounts()");
    await this._simulateDelay();
    return Promise.resolve(mockReportedAccounts.filter((r) => !r.resolved));
  }

  static async reportAccount(
    accountId: string,
    email: string,
    reason: string
  ): Promise<ReportedAccount> {
    console.log(`⚠️ MOCK DATA: reportAccount(${accountId}, ${reason})`);
    await this._simulateDelay();
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === accountId);
    if (accountIndex === -1) {
      throw new Error(
        `Mock account with id ${accountId} not found for reporting`
      );
    }
    mockAccounts[accountIndex].reported = true;
    mockAccounts[accountIndex].reportReason = reason;

    const newReport: ReportedAccount = {
      id: `rep-${Date.now()}`,
      accountId: accountId,
      email: email,
      reportReason: reason,
      reportedAt: new Date(),
      resolved: false,
    };
    mockReportedAccounts.push(newReport);
    return Promise.resolve(newReport);
  }

  static async resolveReport(
    reportId: string,
    newPassword?: string
  ): Promise<void> {
    console.log(
      `⚠️ MOCK DATA: resolveReport(${reportId})`,
      newPassword ? `New Pass: ${newPassword}` : ""
    );
    await this._simulateDelay();
    const reportIndex = mockReportedAccounts.findIndex(
      (r) => r.id === reportId
    );
    if (reportIndex === -1) {
      throw new Error(`Mock report with id ${reportId} not found`);
    }
    // Tandai resolved
    mockReportedAccounts[reportIndex].resolved = true;

    const accountId = mockReportedAccounts[reportIndex].accountId;
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === accountId);
    if (accountIndex !== -1) {
      mockAccounts[accountIndex].reported = false;
      mockAccounts[accountIndex].reportReason = null;
      if (newPassword) {
        mockAccounts[accountIndex].password = newPassword;
      }
    }
    return Promise.resolve();
  }

  static async getAllCustomerAssignments(): Promise<CustomerAssignment[]> {
    console.log("⚠️ MOCK DATA: getAllCustomerAssignments()");
    await this._simulateDelay();
    return Promise.resolve([...mockCustomerAssignments]);
  }

  static async addCustomerAssignment(data: {
    customerIdentifier: string;
    accountId: string;
    accountEmail: string;
    accountType: AccountType;
    profileName: string;
    operatorName?: string | null;
  }): Promise<CustomerAssignment> {
    console.log("⚠️ MOCK DATA: addCustomerAssignment()", data);
    await this._simulateDelay(250);
    const newAssignment: CustomerAssignment = {
      id: `assign-${Date.now()}`,
      customerIdentifier: data.customerIdentifier,
      accountId: data.accountId,
      accountEmail: data.accountEmail,
      accountType: data.accountType,
      profileName: data.profileName,
      operatorName: data.operatorName || null,
      assignedAt: new Date(),
    };
    mockCustomerAssignments.push(newAssignment);

    const newActivity: OperatorActivity = {
      id: `act-${Date.now()}`,
      operatorName: data.operatorName || "Unknown",
      action: "Request Account",
      accountEmail: data.accountEmail,
      accountType: data.accountType,
      date: new Date(),
    };
    mockOperatorActivities.push(newActivity);

    return Promise.resolve(newAssignment);
  }

  static async isCustomerIdentifierUsed(
    customerIdentifier: string
  ): Promise<boolean> {
    console.log(
      `⚠️ MOCK DATA: isCustomerIdentifierUsed(${customerIdentifier})`
    );
    await this._simulateDelay(50);
    const used = mockCustomerAssignments.some(
      (a) =>
        a.customerIdentifier.toLowerCase() === customerIdentifier.toLowerCase()
    );
    return Promise.resolve(used);
  }

  static async getAllOperatorActivities(): Promise<OperatorActivity[]> {
    console.log("⚠️ MOCK DATA: getAllOperatorActivities()");
    await this._simulateDelay();
    return Promise.resolve(
      [...mockOperatorActivities].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      )
    ); // Kembalikan salinan & urutkan
  }

  // == Statistics ==
  static async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    totalAssignments: number;
    privateAccounts: number;
    sharingAccounts: number;
    vipAccounts: number;
  }> {
    console.log("⚠️ MOCK DATA: getCustomerStatistics()");
    await this._simulateDelay();
    const uniqueCustomers = new Set(
      mockCustomerAssignments.map((a) => a.customerIdentifier)
    );
    const privateCount = mockCustomerAssignments.filter(
      (a) => a.accountType === "private"
    ).length;
    const sharingCount = mockCustomerAssignments.filter(
      (a) => a.accountType === "sharing"
    ).length;
    const vipCount = mockCustomerAssignments.filter(
      (a) => a.accountType === "vip"
    ).length; // Hitung vip
    return Promise.resolve({
      totalCustomers: uniqueCustomers.size,
      totalAssignments: mockCustomerAssignments.length,
      privateAccounts: privateCount,
      sharingAccounts: sharingCount,
      vipAccounts: vipCount, // Kembalikan vip
    });
  }

  static async getOperatorStatistics(): Promise<{
    [operator: string]: {
      total: number;
      private: number;
      sharing: number;
      vip: number;
      byDate: { [date: string]: number };
    };
  }> {
    console.log("⚠️ MOCK DATA: getOperatorStatistics()");
    await this._simulateDelay();
    const stats: {
      [operator: string]: {
        total: number;
        private: number;
        sharing: number;
        vip: number;
        byDate: { [date: string]: number };
      };
    } = {};

    mockOperatorActivities.forEach((activity) => {
      const opName = activity.operatorName || "Unknown";
      if (!stats[opName]) {
        stats[opName] = {
          total: 0,
          private: 0,
          sharing: 0,
          vip: 0,
          byDate: {},
        };
      }
      stats[opName].total++;
      if (activity.accountType === "private") stats[opName].private++;
      else if (activity.accountType === "sharing") stats[opName].sharing++;
      else if (activity.accountType === "vip") stats[opName].vip++;

      const dateStr = activity.date.toLocaleDateString("id-ID");
      stats[opName].byDate[dateStr] = (stats[opName].byDate[dateStr] || 0) + 1;
    });
    return Promise.resolve(stats);
  }

  static async getAvailableProfileCount(type: AccountType): Promise<number> {
    console.log(`⚠️ MOCK DATA: getAvailableProfileCount(${type})`);
    await this._simulateDelay(50);
    const count = mockAccounts
      .filter((acc) => acc.type === type && !acc.isGaransiOnly)
      .reduce(
        (sum, acc) => sum + acc.profiles.filter((p) => !p.used).length,
        0
      );
    return Promise.resolve(count);
  }

  // User management (Mock - tidak pakai Prisma)
  // Untuk ini, mungkin lebih baik tetap menggunakan fungsi dari lib/auth.ts
  // karena itu sudah berbasis array di memori.
  // Tapi jika ingin dimasukkan ke sini juga:
  // static async createUser(...) { ... }
  // static async getUserByUsername(...) { ... }
}
