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
// Hanya impor tipe custom
import type { AccountType, PlatformType } from "@/lib/database-service";
// Impor tipe model dari @prisma/client
import type {
  Account,
  GaransiAccount,
  ReportedAccount,
  CustomerAssignment,
  OperatorActivity,
} from "@prisma/client";

// Definisikan tipe data yang dikirim/diterima dari API
type AddAccountPayload = {
  email: string;
  password: string;
  type: AccountType;
  platform: PlatformType;
  expiresAt?: string; // Kirim sebagai string ISO
};

export type UpdateAccountPayload = {
  email?: string;
  password?: string;
  expiresAt?: string; // Kirim sebagai string ISO
  platform?: PlatformType;
};

// --- TIPE BARU UNTUK BULK IMPORT ---
type BulkAddAccountsPayload = {
  accounts: {
    email: string;
    password: string;
    type: AccountType;
    platform: PlatformType;
  }[];
  expiresAt: string; // Kirim sebagai string ISO
};
// --- AKHIR TIPE BARU ---

// Tipe untuk context
interface AccountContextType {
  // States
  accounts: Account[];
  garansiAccounts: GaransiAccount[];
  reportedAccounts: ReportedAccount[]; // State berisi semua report (termasuk resolved)
  customerAssignments: CustomerAssignment[];
  operatorActivities: OperatorActivity[];
  isLoading: boolean;

  // Actions (Async - Panggil API)
  refreshData: () => Promise<void>;
  addAccount: (payload: AddAccountPayload) => Promise<Account | null>;
  // --- TIPE FUNGSI addAccounts (BULK) DITAMBAHKAN ---
  addAccounts: (
    accounts: BulkAddAccountsPayload["accounts"],
    expiresAt: string
  ) => Promise<{ processedCount?: number } | null>;
  // --- AKHIR PENAMBAHAN TIPE ---
  addGaransiAccounts: (
    accounts: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[],
    expiresAt: string
  ) => Promise<void>;
  updateAccount: (
    id: string,
    payload: UpdateAccountPayload
  ) => Promise<Account | null>;
  deleteAccount: (id: string) => Promise<boolean>;
  searchAccountsByEmail: (emailQuery: string) => Promise<Account[]>;
  getGaransiAccountsByDate: (date: string) => Promise<GaransiAccount[]>;
  getGaransiAccountsByExpiresAt: (date: string) => Promise<GaransiAccount[]>;
  // TODO: Tambahkan tipe action lain

  // Getters (Sync - Baca State Client)
  getAccountsByType: (type: AccountType) => Account[];
  getAccountByEmail: (email: string) => Account | undefined;
  getAvailableProfileCount: (type: AccountType) => number;
  getReportedAccounts: () => ReportedAccount[];
  getRemainingDays: (account: Account | GaransiAccount) => number;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Fungsi helper fetch (sudah benar)
async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(endpoint, options);
  if (res.status === 204) return null;
  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text();
    }
    const errorMessage =
      typeof errorBody === "object" && errorBody?.error
        ? errorBody.error
        : typeof errorBody === "string"
        ? errorBody
        : "Unknown server error";
    console.error(
      `API Error (${res.status} ${res.statusText}) on ${endpoint}:`,
      errorMessage
    );
    throw new Error(errorMessage || `Failed request to ${endpoint}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json"))
    return res.json();
  else if (res.ok) {
    console.warn(`Received non-JSON response from ${endpoint}`);
    return await res.text();
  }
  throw new Error(
    `Unexpected response from ${endpoint}: ${res.status} ${res.statusText}`
  );
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [garansiAccounts, setGaransiAccounts] = useState<GaransiAccount[]>([]);
  const [reportedAccounts, setReportedAccounts] = useState<ReportedAccount[]>(
    []
  );
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

  // Refresh Data (sudah benar)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    console.log("🔄 Refreshing data...");
    try {
      const [aData, gData, rData, cData, oData, pCount, sCount, vCount] =
        await Promise.all([
          fetchFromAPI("/api/accounts"),
          fetchFromAPI("/api/garansi-accounts"),
          fetchFromAPI("/api/reported-accounts"),
          fetchFromAPI("/api/customer-assignments"),
          fetchFromAPI("/api/operator-activities"),
          fetchFromAPI("/api/statistics/profiles/private"),
          fetchFromAPI("/api/statistics/profiles/sharing"),
          fetchFromAPI("/api/statistics/profiles/vip"),
        ]);
      setAccounts(Array.isArray(aData) ? aData : []);
      setGaransiAccounts(Array.isArray(gData) ? gData : []);
      setReportedAccounts(Array.isArray(rData) ? rData : []);
      setCustomerAssignments(Array.isArray(cData) ? cData : []);
      setOperatorActivities(Array.isArray(oData) ? oData : []);
      setAvailableProfileCounts({
        private: pCount?.count ?? 0,
        sharing: sCount?.count ?? 0,
        vip: vCount?.count ?? 0,
      });
      console.log("✅ Data refreshed successfully");
    } catch (error) {
      console.error("❌ Error loading data:", error);
      toast({
        title: "⚠️ Database Error",
        description: "Gagal memuat data dari server.",
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

  // useEffects (sudah benar)
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  useEffect(() => {
    const i = setInterval(() => {
      if (!isLoading) refreshData();
    }, 300000);
    return () => clearInterval(i);
  }, [isLoading, refreshData]);

  // --- IMPLEMENTASI FUNGSI AKUN UTAMA (VIA API) ---

  const addAccount = async (
    payload: AddAccountPayload
  ): Promise<Account | null> => {
    try {
      const d = await fetchFromAPI("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refreshData();
      toast({
        title: "✅ Akun Ditambahkan",
        description: `${payload.email} berhasil.`,
      });
      return d;
    } catch (e: any) {
      console.error("Err add acc:", e);
      toast({
        title: "❌ Gagal Tambah",
        description: e.message || "Error.",
        variant: "destructive",
      });
      return null;
    }
  };

  // --- IMPLEMENTASI FUNGSI addAccounts BARU (BULK IMPORT) ---
  const addAccounts = async (
    accounts: BulkAddAccountsPayload["accounts"],
    expiresAt: string
  ): Promise<{ processedCount?: number } | null> => {
    try {
      const payload: BulkAddAccountsPayload = { accounts, expiresAt };
      console.log(
        `Sending bulk import request for ${accounts.length} accounts...`
      );

      // Panggil API bulk import POST /api/accounts/bulk
      const result = await fetchFromAPI("/api/accounts/bulk", {
        // Pastikan endpoint benar
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshData(); // Refresh setelah berhasil
      // Toast sukses ditangani oleh BulkImport.tsx
      console.log("Bulk import API response:", result);
      // Kembalikan hasil dari API (misal: { processedCount: number })
      return result;
    } catch (error: any) {
      console.error("Error adding multiple accounts:", error);
      // Toast error ditangani oleh BulkImport.tsx
      throw error; // Lempar error agar BulkImport bisa menangkapnya
    }
  };
  // --- AKHIR IMPLEMENTASI addAccounts ---

  const updateAccount = async (
    id: string,
    payload: UpdateAccountPayload
  ): Promise<Account | null> => {
    try {
      const d = await fetchFromAPI(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refreshData();
      toast({ title: "✅ Akun Diupdate" });
      return d;
    } catch (e: any) {
      console.error(`Err update acc ${id}:`, e);
      toast({
        title: "❌ Gagal Update",
        description: e.message || "Error.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      await fetchFromAPI(`/api/accounts/${id}`, { method: "DELETE" });
      await refreshData();
      toast({ title: "✅ Akun Dihapus" });
      return true;
    } catch (e: any) {
      console.error(`Err delete acc ${id}:`, e);
      toast({
        title: "❌ Gagal Hapus",
        description: e.message || "Error.",
        variant: "destructive",
      });
      return false;
    }
  };

  const searchAccountsByEmail = async (
    emailQuery: string
  ): Promise<Account[]> => {
    if (!emailQuery?.trim()) return [];
    try {
      const q = encodeURIComponent(emailQuery);
      const d = await fetchFromAPI(`/api/accounts/search?email=${q}`);
      return Array.isArray(d) ? d : [];
    } catch (e: any) {
      console.error("Err search acc:", e);
      toast({
        title: "❌ Gagal Cari",
        description: e.message || "Error.",
        variant: "destructive",
      });
      return [];
    }
  };

  // --- AKHIR IMPLEMENTASI FUNGSI AKUN UTAMA ---

  // --- Implementasi Fungsi Garansi (Sudah Benar via API) ---
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
        const e = await res.json().catch(() => ({ error: "Parse fail" }));
        throw new Error(e.error || `Server error: ${res.status}`);
      }
      await refreshData();
    } catch (error) {
      console.error("Error adding garansi accounts:", error);
      throw error;
    }
  };

  const getGaransiAccountsByDate = useCallback(
    async (date: string): Promise<GaransiAccount[]> => {
      // Tambah useCallback
      try {
        const d = await fetchFromAPI(
          `/api/garansi-accounts/search/by-date?date=${date}`
        );
        return Array.isArray(d) ? d : [];
      } catch (e: any) {
        console.error("Err fetch garansi by date:", e);
        toast({
          title: "❌ Gagal Cari Garansi",
          description: e.message || "Gagal cari by date.",
          variant: "destructive",
        });
        return [];
      }
    },
    [toast]
  ); // Tambah dependency toast

  const getGaransiAccountsByExpiresAt = useCallback(
    async (date: string): Promise<GaransiAccount[]> => {
      // Tambah useCallback
      try {
        const d = await fetchFromAPI(
          `/api/garansi-accounts/search/by-expires?date=${date}`
        );
        return Array.isArray(d) ? d : [];
      } catch (e: any) {
        console.error("Err fetch garansi by expires:", e);
        toast({
          title: "❌ Gagal Cari Garansi",
          description: e.message || "Gagal cari by expires.",
          variant: "destructive",
        });
        return [];
      }
    },
    [toast]
  ); // Tambah dependency toast
  // --- Akhir Fungsi Garansi ---

  // --- Fungsi Getter Client-Side (Sudah Benar) ---
  const getRemainingDays = useCallback(
    (account: Account | GaransiAccount): number => {
      // Tambah useCallback
      if (!account?.expiresAt) return 0;
      try {
        const now = new Date();
        const expires = new Date(account.expiresAt);
        if (isNaN(expires.getTime())) return 0;
        const diffTime = expires.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(-999, diffDays);
      } catch (e) {
        return 0;
      }
    },
    []
  ); // Dependency kosong

  const getAccountsByType = useCallback(
    (type: AccountType): Account[] => {
      // Tambah useCallback
      if (!Array.isArray(accounts)) return [];
      return accounts.filter((account) => account.type === type);
    },
    [accounts]
  ); // Dependency: accounts

  const getAccountByEmail = useCallback(
    (email: string): Account | undefined => {
      // Tambah useCallback
      if (!Array.isArray(accounts) || !email) return undefined;
      return accounts.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      );
    },
    [accounts]
  ); // Dependency: accounts

  const getAvailableProfileCount = useCallback(
    (type: AccountType): number => {
      return availableProfileCounts[type] ?? 0;
    },
    [availableProfileCounts]
  );

  const getReportedAccounts = useCallback((): ReportedAccount[] => {
    // Tambah useCallback
    return Array.isArray(reportedAccounts)
      ? reportedAccounts.filter((report) => !report.resolved)
      : [];
  }, [reportedAccounts]); // Dependency: reportedAccounts
  // --- Akhir Fungsi Getter ---

  // TODO: Implementasikan fungsi action lain (report, resolve, assign) via API

  // --- PASTIKAN SEMUA FUNGSI ADA DI VALUE ---
  return (
    <AccountContext.Provider
      value={{
        // States
        accounts,
        garansiAccounts,
        reportedAccounts,
        customerAssignments,
        operatorActivities,
        isLoading,
        // Actions (via API)
        refreshData,
        addAccount,
        addAccounts, // <-- Tambahkan fungsi bulk import ke value
        addGaransiAccounts,
        updateAccount,
        deleteAccount,
        searchAccountsByEmail,
        getGaransiAccountsByDate,
        getGaransiAccountsByExpiresAt,
        // Getters (Client-side)
        getRemainingDays,
        getAccountsByType,
        getAccountByEmail,
        getAvailableProfileCount,
        getReportedAccounts,
        // TODO: Export fungsi action lain
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

// Hook useAccounts (sudah benar)
export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountProvider");
  }
  return context;
}
