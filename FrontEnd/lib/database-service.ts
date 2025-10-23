// import { prisma } from "./prisma"; // Komentari atau hapus impor prisma

// Impor tipe dari file terpusat (jika sudah dipindahkan)
import type {
  AccountType,
  Profile,
  Account,
  GaransiAccount,
  ReportedAccount,
  CustomerAssignment,
  OperatorActivity,
} from "./types"; // Pastikan path ini benar

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
  // Gunakan 'vip' di sini
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
    platform: "Netflix", // Contoh platform
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
    platform: "Spotify", // Contoh platform
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
    type: "vip", // Ganti vvip -> vip
    platform: "Netflix",
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
    platform: "Disney+", // Contoh platform
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
    platform: "Netflix",
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
    accountId: "mock-vip-1", // Ganti vvip -> vip jika perlu
    platform: "Netflix",
    email: "mock.vip1@example.com", // Ganti vvip -> vip jika perlu
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
    platform: "Netflix",
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
    platform: "Spotify",
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
    platform: "Netflix",
    accountEmail: "mock.private1@example.com",
    accountType: "private",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "act-2",
    operatorName: "Admin",
    action: "Request Account",
    platform: "Spotify",
    accountEmail: "mock.sharing1@example.com",
    accountType: "sharing",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "act-3",
    operatorName: "Admin",
    action: "Add Account",
    platform: "Netflix",
    accountEmail: "mock.vip1@example.com", // Ganti vvip -> vip jika perlu
    accountType: "vip", // Ganti vvip -> vip
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// --- Mock Database Service ---
export class DatabaseService {
  static async _simulateDelay(ms: number = 150) {
    // console.log(`Simulating DB delay: ${ms}ms`); // Uncomment for debugging delay
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // == Account operations ==
  static async getAllAccounts(): Promise<Account[]> {
    console.log("⚠️ MOCK DATA: getAllAccounts()");
    await this._simulateDelay();
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
    platform: string; // <-- Terima platform
    profiles?: Profile[];
  }): Promise<Account> {
    console.log("⚠️ MOCK DATA: addAccount()", data);
    await this._simulateDelay(300);
    const creationDate = new Date();
    const newAccount: Account = {
      id: `mock-${Date.now()}`,
      email: data.email,
      password: data.password,
      type: data.type,
      platform: data.platform, // <-- Simpan platform
      profiles: data.profiles || generateProfiles(data.type),
      createdAt: creationDate,
      expiresAt: calculateExpirationDate(creationDate),
      isGaransiOnly: false,
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
      platform: string; // <-- Terima platform
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
        platform: accData.platform, // <-- Simpan platform
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
      platform?: string; // Izinkan update platform jika perlu
    }
  ): Promise<Account> {
    console.log(`⚠️ MOCK DATA: updateAccount(${id})`, data);
    await this._simulateDelay();
    const accountIndex = mockAccounts.findIndex((acc) => acc.id === id);
    if (accountIndex === -1) {
      throw new Error(`Mock account with id ${id} not found`);
    }
    // Update data
    if (data.email !== undefined) mockAccounts[accountIndex].email = data.email;
    if (data.password !== undefined)
      mockAccounts[accountIndex].password = data.password;
    if (data.expiresAt !== undefined)
      mockAccounts[accountIndex].expiresAt = data.expiresAt;
    if (data.profiles !== undefined)
      mockAccounts[accountIndex].profiles = data.profiles;
    if (data.platform !== undefined)
      (mockAccounts[accountIndex] as any).platform = data.platform; // Perlu cast jika interface belum diupdate

    return Promise.resolve({ ...mockAccounts[accountIndex] });
  }

  static async deleteAccount(id: string): Promise<void> {
    console.log(`⚠️ MOCK DATA: deleteAccount(${id})`);
    await this._simulateDelay();
    const initialLength = mockAccounts.length;
    mockAccounts = mockAccounts.filter((acc) => acc.id !== id);
    mockCustomerAssignments = mockCustomerAssignments.filter(
      (a) => a.accountId !== id
    );
    mockReportedAccounts = mockReportedAccounts.filter(
      (r) => r.accountId !== id
    );

    if (mockAccounts.length === initialLength) {
      console.warn(`Mock account with id ${id} not found for deletion.`);
    }
    return Promise.resolve();
  }

  // == Garansi Account operations ==
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
      platform: string; // <-- Terima platform
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
        platform: accData.platform, // <-- Simpan platform
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

  // == Reported Account operations ==
  static async getAllReportedAccounts(): Promise<ReportedAccount[]> {
    console.log("⚠️ MOCK DATA: getAllReportedAccounts()");
    await this._simulateDelay();
    return Promise.resolve(mockReportedAccounts.filter((r) => !r.resolved));
  }

  static async reportAccount(
    accountId: string,
    email: string,
    reason: string,
    platform: string
  ): Promise<ReportedAccount> {
    // <-- Terima platform
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
      platform: platform, // <-- Simpan platform
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

  // == Customer Assignment operations ==
  static async getAllCustomerAssignments(): Promise<CustomerAssignment[]> {
    console.log("⚠️ MOCK DATA: getAllCustomerAssignments()");
    await this._simulateDelay();
    return Promise.resolve([...mockCustomerAssignments]);
  }

  static async addCustomerAssignment(data: {
    customerIdentifier: string;
    accountId: string;
    platform: string; // <-- Terima platform
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
      platform: data.platform, // <-- Simpan platform
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
      platform: data.platform, // <-- Log platform
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

  // == Operator Activity operations ==
  static async getAllOperatorActivities(): Promise<OperatorActivity[]> {
    console.log("⚠️ MOCK DATA: getAllOperatorActivities()");
    await this._simulateDelay();
    return Promise.resolve(
      [...mockOperatorActivities].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      )
    );
  }

  // == Statistics ==
  static async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    totalAssignments: number;
    privateAccounts: number;
    sharingAccounts: number;
    vipAccounts: number; // Ganti vvip -> vip
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
    ).length; // Ganti vvip -> vip
    return Promise.resolve({
      totalCustomers: uniqueCustomers.size,
      totalAssignments: mockCustomerAssignments.length,
      privateAccounts: privateCount,
      sharingAccounts: sharingCount,
      vipAccounts: vipCount, // Ganti vvip -> vip
    });
  }

  static async getOperatorStatistics(): Promise<{
    [operator: string]: {
      total: number;
      private: number;
      sharing: number;
      vip: number; // Ganti vvip -> vip
      byDate: { [date: string]: number };
      byPlatform?: { [platform: string]: number }; // Opsional: Statistik per platform
    };
  }> {
    console.log("⚠️ MOCK DATA: getOperatorStatistics()");
    await this._simulateDelay();
    const stats: {
      [operator: string]: {
        total: number;
        private: number;
        sharing: number;
        vip: number; // Ganti vvip -> vip
        byDate: { [date: string]: number };
        byPlatform: { [platform: string]: number }; // Tambahkan ini
      };
    } = {};

    mockOperatorActivities.forEach((activity) => {
      const opName = activity.operatorName || "Unknown";
      if (!stats[opName]) {
        // Init vip dan byPlatform
        stats[opName] = {
          total: 0,
          private: 0,
          sharing: 0,
          vip: 0,
          byDate: {},
          byPlatform: {},
        };
      }
      stats[opName].total++;
      if (activity.accountType === "private") stats[opName].private++;
      else if (activity.accountType === "sharing") stats[opName].sharing++;
      else if (activity.accountType === "vip") stats[opName].vip++; // Ganti vvip -> vip

      const dateStr = activity.date.toLocaleDateString("id-ID");
      stats[opName].byDate[dateStr] = (stats[opName].byDate[dateStr] || 0) + 1;

      // Hitung per platform
      const platform = activity.platform || "Unknown";
      stats[opName].byPlatform[platform] =
        (stats[opName].byPlatform[platform] || 0) + 1;
    });
    return Promise.resolve(stats);
  }

  static async getAvailableProfileCount(
    type: AccountType,
    platform?: string
  ): Promise<number> {
    // Tambah parameter platform opsional
    console.log(
      `⚠️ MOCK DATA: getAvailableProfileCount(${type}, ${
        platform || "all platforms"
      })`
    );
    await this._simulateDelay(50);
    const count = mockAccounts
      .filter(
        (acc) =>
          acc.type === type &&
          !acc.isGaransiOnly &&
          (!platform || acc.platform === platform) // Filter by platform jika ada
      )
      .reduce(
        (sum, acc) => sum + acc.profiles.filter((p) => !p.used).length,
        0
      );
    return Promise.resolve(count);
  }

  // Fungsi _simulateDelay bisa dipindahkan ke luar class jika mau
  // static async _simulateDelay(ms: number = 150) { ... }
}

// Jika _simulateDelay di luar class:
async function _simulateDelay(ms: number = 150) {
  // console.log(`Simulating DB delay: ${ms}ms`);
  await new Promise((resolve) => setTimeout(resolve, ms));
}
// Lalu di dalam class panggil `await _simulateDelay()`
