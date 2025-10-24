"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
// Hanya impor tipe custom dari database-service
import type { AccountType, PlatformType } from "@/lib/database-service";
// --- IMPOR TIPE MODEL DARI @prisma/client ---
import type {
  Account,
  GaransiAccount,
  ReportedAccount,
  CustomerAssignment,
  OperatorActivity,
} from "@prisma/client";
// --- AKHIR PERUBAHAN IMPOR ---

interface AccountContextType {
  accounts: Account[];
  garansiAccounts: GaransiAccount[];
  reportedAccounts: ReportedAccount[]; // State berisi semua report (termasuk resolved)
  customerAssignments: CustomerAssignment[];
  operatorActivities: OperatorActivity[];

  // Tipe addGaransiAccounts DIPERBARUI
  addGaransiAccounts: (
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType; // Platform wajib
    }[],
    expiresAt: string // Diubah jadi expiresAt (string ISO)
  ) => Promise<void>;

  // Fungsi pencarian BARU
  getGaransiAccountsByExpiresAt: (date: string) => Promise<GaransiAccount[]>;
  getGaransiAccountsByDate: (date: string) => Promise<GaransiAccount[]>;
  getRemainingDays: (account: Account | GaransiAccount) => number;
  getAccountsByType: (type: AccountType) => Account[];
  getAccountByEmail: (email: string) => Account | undefined;
  getAvailableProfileCount: (type: AccountType) => number;
  // --- TIPE FUNGSI BARU DITAMBAHKAN ---
  getReportedAccounts: () => ReportedAccount[]; // Fungsi untuk filter state
  // --- AKHIR PENAMBAHAN TIPE ---

  isLoading: boolean;
  refreshData: () => Promise<void>;
  // ... (Tambahkan tipe fungsi lain yang Anda perlukan)
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Fungsi helper untuk fetch (agar tidak berulang)
async function fetchFromAPI(endpoint: string) {
  const res = await fetch(endpoint);
  if (!res.ok) {
    const errorBody = await res.text(); // Baca body error untuk debug
    throw new Error(
      `Failed to fetch ${endpoint}: ${res.status} ${res.statusText} - ${errorBody}`
    );
  }
  if (res.status === 204) {
    return null;
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  } else {
    console.warn(`Received non-JSON response from ${endpoint}`);
    return await res.text();
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [garansiAccounts, setGaransiAccounts] = useState<GaransiAccount[]>([]);
  const [reportedAccounts, setReportedAccounts] = useState<ReportedAccount[]>(
    []
  ); // State ini akan berisi SEMUA report dari API
  const [customerAssignments, setCustomerAssignments] = useState<
    CustomerAssignment[]
  >([]);
  const [operatorActivities, setOperatorActivities] = useState<
    OperatorActivity[]
  >([]);
  const [availableProfileCounts, setAvailableProfileCounts] = useState<{
    private: number;
    sharing: number;
    vip: number;
  }>({ private: 0, sharing: 0, vip: 0 });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    console.log("🔄 Refreshing data...");
    try {
      const [
        accountsData,
        garansiAccountsData,
        reportedAccountsData, // API ini mengembalikan SEMUA report (termasuk resolved)
        customerAssignmentsData,
        operatorActivitiesData,
        privateCountData,
        sharingCountData,
        vipCountData,
      ] = await Promise.all([
        fetchFromAPI("/api/accounts"),
        fetchFromAPI("/api/garansi-accounts"),
        fetchFromAPI("/api/reported-accounts"), // Pastikan API ini mengembalikan SEMUA
        fetchFromAPI("/api/customer-assignments"),
        fetchFromAPI("/api/operator-activities"),
        fetchFromAPI("/api/statistics/profiles/private"),
        fetchFromAPI("/api/statistics/profiles/sharing"),
        fetchFromAPI("/api/statistics/profiles/vip"),
      ]);

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setGaransiAccounts(
        Array.isArray(garansiAccountsData) ? garansiAccountsData : []
      );
      // Simpan SEMUA report di state
      setReportedAccounts(
        Array.isArray(reportedAccountsData) ? reportedAccountsData : []
      );
      setCustomerAssignments(
        Array.isArray(customerAssignmentsData) ? customerAssignmentsData : []
      );
      setOperatorActivities(
        Array.isArray(operatorActivitiesData) ? operatorActivitiesData : []
      );

      setAvailableProfileCounts({
        private: privateCountData?.count ?? 0,
        sharing: sharingCountData?.count ?? 0,
        vip: vipCountData?.count ?? 0,
      });

      console.log("✅ Data refreshed successfully");
    } catch (error) {
      console.error("❌ Error loading data:", error);
      toast({
        title: "⚠️ Database Error",
        description: "Gagal memuat data dari server. Silakan refresh.",
        variant: "destructive",
      });
      setAccounts([]);
      setGaransiAccounts([]);
      setReportedAccounts([]);
      setCustomerAssignments([]);
      setOperatorActivities([]);
      setAvailableProfileCounts({ private: 0, sharing: 0, vip: 0 });
    } finally {
      setIsLoading(false);
      console.log("🏁 Refresh complete.");
    }
  }, [toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData();
      }
    }, 300000); // 5 menit
    return () => clearInterval(interval);
  }, [isLoading, refreshData]);

  const addGaransiAccounts = async (
    newAccounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt: string
  ) => {
    try {
      const res = await fetch("/api/garansi-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: newAccounts, expiresAt }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      await refreshData();
    } catch (error) {
      console.error("Error adding garansi accounts:", error);
      throw error;
    }
  };

  const getGaransiAccountsByDate = async (date: string) => {
    try {
      const data = await fetchFromAPI(
        `/api/garansi-accounts/search/by-date?date=${date}`
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching garansi accounts by date:", error);
      toast({
        title: "❌ Gagal Mencari",
        description: "Tidak dapat mengambil data berdasarkan tanggal dibuat.",
        variant: "destructive",
      });
      return [];
    }
  };

  const getGaransiAccountsByExpiresAt = async (date: string) => {
    try {
      const data = await fetchFromAPI(
        `/api/garansi-accounts/search/by-expires?date=${date}`
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching garansi accounts by expires date:", error);
      toast({
        title: "❌ Gagal Mencari",
        description:
          "Tidak dapat mengambil data berdasarkan tanggal kadaluarsa.",
        variant: "destructive",
      });
      return [];
    }
  };

  const getRemainingDays = (account: Account | GaransiAccount) => {
    if (!account?.expiresAt) return 0;
    try {
      const now = new Date();
      const expiresAt = new Date(account.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        console.warn("Invalid expiresAt date received:", account.expiresAt);
        return 0;
      }
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (e) {
      console.error(
        "Error calculating remaining days:",
        e,
        "Input:",
        account.expiresAt
      );
      return 0;
    }
  };

  const getAccountsByType = (type: AccountType) => {
    if (!Array.isArray(accounts)) {
      return [];
    }
    return accounts.filter((account) => account.type === type);
  };

  const getAccountByEmail = (email: string) => {
    if (!Array.isArray(accounts)) return undefined;
    return accounts.find(
      (account) => account.email.toLowerCase() === email.toLowerCase()
    );
  };

  const getAvailableProfileCount = useCallback(
    (type: AccountType): number => {
      return availableProfileCounts[type] ?? 0;
    },
    [availableProfileCounts]
  );

  // --- Implementasi getReportedAccounts (Filter state) ---
  // Fungsi ini HANYA MEMFILTER state `reportedAccounts` yang sudah diambil oleh `refreshData`
  // Dia mengembalikan HANYA report yang belum resolved
  const getReportedAccounts = useCallback(() => {
    return Array.isArray(reportedAccounts)
      ? reportedAccounts.filter((report) => !report.resolved)
      : [];
  }, [reportedAccounts]); // Tambahkan dependency
  // --- Akhir implementasi ---

  // ... (Implementasi fungsi lain perlu ditambahkan/disesuaikan untuk memanggil API)

  return (
    <AccountContext.Provider
      value={{
        accounts,
        garansiAccounts,
        reportedAccounts, // State berisi SEMUA report
        customerAssignments,
        operatorActivities,
        addGaransiAccounts,
        getGaransiAccountsByDate,
        getGaransiAccountsByExpiresAt,
        getRemainingDays,
        isLoading,
        refreshData,
        getAccountsByType,
        getAccountByEmail,
        getAvailableProfileCount, // Sudah ditambahkan sebelumnya
        // --- TAMBAHKAN FUNGSI DI VALUE PROVIDER ---
        getReportedAccounts, // Sekarang diexport ke komponen
        // --- AKHIR PENAMBAHAN ---
        // ... (Tambahkan fungsi lain yang sudah diimplementasikan)
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountProvider");
  }
  return context;
}
