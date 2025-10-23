// lib/types.ts

// ===========================
// 🔹 Account Types
// ===========================
export type AccountType = "private" | "sharing" | "vip";

export interface Account {
  id: string;
  email: string;
  password: string;
  type: AccountType;
  profiles: Profile[];
  createdAt: string;
  expiresAt: string | null;
  reported?: boolean;
  reportReason?: string | null;
  isGaransiOnly?: boolean;
  platformId?: string | null;
}

// ===========================
// 🔹 Profile
// ===========================
export interface Profile {
  profile: string;
  pin: string;
  used?: boolean;
}

// ===========================
// 🔹 Administrator & Operator
// ===========================
export interface UserBase {
  id: string;
  username: string;
  password: string;
  name: string;
  createdAt: string;
  role: "admin" | "operator" | "superadmin";
}

export type Administrator = Omit<UserBase, "role"> & {
  role: "admin" | "superadmin";
};

export type Operator = Omit<UserBase, "role"> & {
  role: "operator";
};

// ===========================
// 🔹 Garansi Account
// ===========================
export interface GaransiAccount extends Account {
  warrantyDate: string;
}

// ===========================
// 🔹 Platform
// ===========================
export interface Platform {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}
