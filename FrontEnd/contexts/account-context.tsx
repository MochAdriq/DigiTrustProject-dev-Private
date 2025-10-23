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
// Pastikan AccountType diimpor dari database-service
import { DatabaseService, type AccountType } from "@/lib/database-service";
import type {
  Account,
  GaransiAccount,
  ReportedAccount,
  CustomerAssignment,
  OperatorActivity,
} from "@/lib/database-service";

interface AccountContextType {
  accounts: Account[];
  garansiAccounts: GaransiAccount[];
  reportedAccounts: ReportedAccount[];
  customerAssignments: CustomerAssignment[];
  operatorActivities: OperatorActivity[];
  // Pastikan tipe di sini menggunakan AccountType yang sudah mencakup vip
  addAccount: (
    account: Omit<Account, "id" | "createdAt" | "expiresAt">
  ) => Promise<void>;
  addAccounts: (
    accounts: { email: string; password: string; type: AccountType }[]
  ) => Promise<void>;
  addAccountsWithDate: (
    accounts: { email: string; password: string; type: AccountType },
    targetDate: string
  ) => Promise<void>;
  addAccountsWithCustomProfiles: (
    accounts:
      | {
          email: string;
          password: string;
          type: AccountType;
          profileCount?: number;
        }[]
      | {
          email: string;
          password: string;
          type: AccountType;
          profileCount: number;
        },
    targetDate?: string
  ) => Promise<void>;
  addGaransiAccounts: (
    accounts: { email: string; password: string; type: AccountType }[],
    warrantyDate: string
  ) => Promise<void>;
  getAccountsByType: (type: AccountType) => Account[]; // Terima AccountType
  getAccountByEmail: (email: string) => Account | undefined;
  getAccountsByDate: (date: string) => Promise<GaransiAccount[]>;
  getGaransiAccountsByDate: (date: string) => Promise<GaransiAccount[]>;
  markProfileAsUsed: (accountId: string, profileIndex: number) => Promise<void>;
  getAvailableProfileCount: (type: AccountType) => number; // Terima AccountType
  reportAccount: (email: string, reason: string) => Promise<boolean>;
  resolveReport: (reportId: string, newPassword?: string) => Promise<void>;
  getReportedAccounts: () => ReportedAccount[];
  getRemainingDays: (account: Account | GaransiAccount) => number;
  updateAccount: (
    id: string,
    data: { email?: string; password?: string; expiresAt?: Date }
  ) => Promise<void>;
  isCustomerIdentifierUsed: (customerIdentifier: string) => Promise<boolean>;
  addCustomerAssignment: (
    assignment: Omit<CustomerAssignment, "id" | "assignedAt">
  ) => Promise<void>;
  getCustomerAssignments: () => CustomerAssignment[];
  getCustomerStatistics: () => Promise<{
    totalCustomers: number;
    totalAssignments: number;
    privateAccounts: number;
    sharingAccounts: number;
  }>;
  getOperatorStatistics: () => Promise<{
    [operator: string]: {
      total: number;
      private: number;
      sharing: number;
      byDate: { [date: string]: number };
    };
  }>;
  deleteAccount: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  saveAllData: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

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
  // Tambahkan vip di state
  const [availableProfileCounts, setAvailableProfileCounts] = useState<{
    private: number;
    sharing: number;
    vip: number; // <-- Tambahkan ini
  }>({ private: 0, sharing: 0, vip: 0 }); // <-- Inisialisasi

  // Definisikan refreshData sebelum saveAllData
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ambil juga hitungan vip
      const [
        accountsData,
        garansiAccountsData,
        reportedAccountsData,
        customerAssignmentsData,
        operatorActivitiesData,
        privateCount,
        sharingCount,
        vipCount, // <-- Ambil ini
      ] = await Promise.all([
        DatabaseService.getAllAccounts(),
        DatabaseService.getAllGaransiAccounts(),
        DatabaseService.getAllReportedAccounts(),
        DatabaseService.getAllCustomerAssignments(),
        DatabaseService.getAllOperatorActivities(),
        DatabaseService.getAvailableProfileCount("private"),
        DatabaseService.getAvailableProfileCount("sharing"),
        DatabaseService.getAvailableProfileCount("vip"), // <-- Panggil ini
      ]);

      setAccounts(accountsData);
      setGaransiAccounts(garansiAccountsData);
      setReportedAccounts(reportedAccountsData);
      setCustomerAssignments(customerAssignmentsData);
      setOperatorActivities(operatorActivitiesData);
      // Set state vip
      setAvailableProfileCounts({
        private: privateCount,
        sharing: sharingCount,
        vip: vipCount,
      }); // <-- Set ini
    } catch (error) {
      console.error("❌ Error loading data:", error);
      toast({
        title: "⚠️ Database Error",
        description:
          "Failed to load data from database. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveAllData = useCallback(async () => {
    try {
      console.log("🔄 Syncing with database...");
      await refreshData();
      console.log("✅ Data synced successfully");
    } catch (error) {
      console.error("❌ Error syncing data:", error);
      toast({
        title: "⚠️ Sync Error",
        description: "Failed to sync with database. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [isLoading, refreshData]);

  // Pastikan fungsi-fungsi menerima AccountType
  const addAccount = async (
    newAccount: Omit<Account, "id" | "createdAt" | "expiresAt">
  ) => {
    // ... (kode fungsi ini sudah benar) ...
  };

  const addAccounts = async (
    newAccounts: { email: string; password: string; type: AccountType }[]
  ) => {
    // ... (kode fungsi ini sudah benar) ...
  };

  const addGaransiAccounts = async (
    newAccounts: { email: string; password: string; type: AccountType }[],
    warrantyDate: string
  ) => {
    // ... (kode fungsi ini sudah benar) ...
  };

  const addAccountsWithDate = async (
    newAccount: { email: string; password: string; type: AccountType },
    targetDate: string
  ) => {
    // ... (kode fungsi ini sudah benar) ...
  };

  const addAccountsWithCustomProfiles = async (
    accountsData:
      | {
          email: string;
          password: string;
          type: AccountType;
          profileCount?: number;
        }[]
      | {
          email: string;
          password: string;
          type: AccountType;
          profileCount: number;
        },
    targetDate?: string
  ) => {};

  const getAccountsByType = (type: AccountType) => {
    // ▼▼▼ Tambahkan Pengecekan Ini ▼▼▼
    if (!Array.isArray(accounts)) {
      console.warn(
        "getAccountsByType called before accounts state is ready, returning empty array."
      );
      return [];
    }
    // ▲▲▲ Akhir Pengecekan ▲▲▲

    return accounts.filter(
      (account) => account.type === type && !account.isGaransiOnly
    );
  };

  const addCustomerAssignment = async (
    assignment: Omit<CustomerAssignment, "id" | "assignedAt">
  ) => {
    try {
      await DatabaseService.addCustomerAssignment({
        ...assignment,
        operatorName: assignment.operatorName ?? undefined,
      });
      await refreshData();
    } catch (error) {
      console.error("Error adding customer assignment:", error);
      toast({
        title: "❌ Error",
        description: "Failed to assign account to customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAvailableProfileCount = (type: AccountType) => {
    return availableProfileCounts[type] || 0;
  };

  const getAccountByEmail = (email: string) => {
    return accounts.find(
      (account) => account.email.toLowerCase() === email.toLowerCase()
    );
  };

  const getAccountsByDate = async (date: string) => {
    return await DatabaseService.getGaransiAccountsByDate(new Date(date));
  };

  const getGaransiAccountsByDate = async (date: string) => {
    return await DatabaseService.getGaransiAccountsByDate(new Date(date));
  };

  const markProfileAsUsed = async (accountId: string, profileIndex: number) => {
    try {
      const account = accounts.find(
        (a) => a.id === accountId && !a.isGaransiOnly
      );
      if (!account) {
        toast({
          title: "❌ Error",
          description:
            "Cannot use profiles from garansi accounts. Only main stock accounts can be used.",
          variant: "destructive",
        });
        return;
      }
      const updatedProfiles = [...account.profiles];
      if (updatedProfiles[profileIndex]) {
        updatedProfiles[profileIndex] = {
          ...updatedProfiles[profileIndex],
          used: true,
        };
      }
      await DatabaseService.updateAccount(accountId, {
        profiles: updatedProfiles,
      });
      await refreshData();
    } catch (error) {
      console.error("Error marking profile as used:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reportAccount = async (email: string, reason: string) => {
    try {
      const account = getAccountByEmail(email);
      if (!account) return false;
      if (account.isGaransiOnly) {
        toast({
          title: "⚠️ Warning",
          description:
            "Cannot report garansi accounts. Only main stock accounts can be reported.",
          variant: "destructive",
        });
        return false;
      }
      await DatabaseService.reportAccount(account.id, email, reason);
      await refreshData();
      toast({
        title: "✅ Account Reported",
        description: "The account has been reported successfully.",
      });
      return true;
    } catch (error) {
      console.error("Error reporting account:", error);
      toast({
        title: "❌ Error",
        description: "Failed to report account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resolveReport = async (reportId: string, newPassword?: string) => {
    try {
      await DatabaseService.resolveReport(reportId, newPassword);
      await refreshData();
      toast({
        title: "✅ Report Resolved",
        description: newPassword
          ? "The account has been updated with the new password."
          : "The report has been marked as resolved.",
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "❌ Error",
        description: "Failed to resolve report. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getReportedAccounts = () => {
    return reportedAccounts.filter((report) => !report.resolved);
  };

  const getRemainingDays = (account: Account | GaransiAccount) => {
    const now = new Date();
    const expiresAt = new Date(account.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const updateAccount = async (
    id: string,
    data: { email?: string; password?: string; expiresAt?: Date }
  ) => {
    try {
      await DatabaseService.updateAccount(id, data);
      await refreshData();
      toast({
        title: "✅ Account Updated",
        description: "The account has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const isCustomerIdentifierUsed = async (customerIdentifier: string) => {
    return await DatabaseService.isCustomerIdentifierUsed(customerIdentifier);
  };

  const getCustomerAssignments = () => {
    return customerAssignments;
  };

  const getCustomerStatistics = async () => {
    return await DatabaseService.getCustomerStatistics();
  };

  const getOperatorStatistics = async () => {
    return await DatabaseService.getOperatorStatistics();
  };

  const deleteAccount = async (id: string) => {
    try {
      await DatabaseService.deleteAccount(id);
      await refreshData();
      toast({
        title: "✅ Account Deleted",
        description: "The account has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "❌ Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        garansiAccounts,
        reportedAccounts,
        customerAssignments,
        operatorActivities,
        addAccount,
        addAccounts,
        addAccountsWithDate,
        addAccountsWithCustomProfiles,
        addGaransiAccounts,
        getAccountsByType,
        getAccountByEmail,
        getAccountsByDate,
        getGaransiAccountsByDate,
        markProfileAsUsed,
        getAvailableProfileCount,
        reportAccount,
        resolveReport,
        getReportedAccounts,
        getRemainingDays,
        updateAccount,
        deleteAccount,
        isCustomerIdentifierUsed,
        addCustomerAssignment,
        getCustomerAssignments,
        getCustomerStatistics,
        getOperatorStatistics,
        isLoading,
        refreshData,
        saveAllData,
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

export { AccountType };
