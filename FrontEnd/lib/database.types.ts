// lib/database.types.ts

// ============================================================
// 🔹 JSON Type Helper
// ============================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// 🔹 Profile Schema
// ============================================================
export interface Profile {
  profile: string;
  pin: string;
  used: boolean;
}

// ============================================================
// 🔹 AccountType Enum (sinkron dengan Prisma)
// ============================================================
export type AccountType = "sharing" | "private" | "vip";

// ============================================================
// 🔹 Account Schema
// ============================================================
export interface Account {
  id: string;
  email: string;
  password: string; // plaintext sesuai permintaan
  type: AccountType;
  profiles: Profile[];
  createdAt: string;
  expiresAt: string | null;
  reported: boolean;
  reportReason?: string | null;
}

// ============================================================
// 🔹 Garansi Account Schema
// ============================================================
export interface GaransiAccount {
  id: string;
  email: string;
  password: string;
  type: AccountType;
  profiles: Profile[];
  createdAt: string;
  expiresAt: string | null;
  warrantyDate: string;
  isActive: boolean;
}

// ============================================================
// 🔹 Reported Account Schema
// ============================================================
export interface ReportedAccount {
  id: string;
  accountId: string;
  email: string;
  reportReason: string;
  reportedAt: string;
  resolved: boolean;
}

// ============================================================
// 🔹 Customer Assignment Schema
// ============================================================
export interface CustomerAssignment {
  id: string;
  customerIdentifier: string;
  accountId: string;
  accountEmail: string;
  accountType: AccountType;
  profileName: string;
  operatorName?: string | null;
  assignedAt: string;
}

// ============================================================
// 🔹 Operator Activity Schema
// ============================================================
export interface OperatorActivity {
  id: string;
  operatorName: string;
  action: string;
  accountEmail: string;
  accountType: AccountType;
  date: string;
}

// ============================================================
// 🔹 Root Database Type (Supabase Compatibility)
// ============================================================
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "createdAt">;
        Update: Partial<Account>;
      };
      garansi_accounts: {
        Row: GaransiAccount;
        Insert: Omit<GaransiAccount, "id" | "createdAt">;
        Update: Partial<GaransiAccount>;
      };
      reported_accounts: {
        Row: ReportedAccount;
        Insert: Omit<ReportedAccount, "id" | "reportedAt">;
        Update: Partial<ReportedAccount>;
      };
      customer_assignments: {
        Row: CustomerAssignment;
        Insert: Omit<CustomerAssignment, "id" | "assignedAt">;
        Update: Partial<CustomerAssignment>;
      };
      operator_activities: {
        Row: OperatorActivity;
        Insert: Omit<OperatorActivity, "id" | "date">;
        Update: Partial<OperatorActivity>;
      };
    };
  };
}
