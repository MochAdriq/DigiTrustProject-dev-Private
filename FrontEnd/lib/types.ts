// Di dalam file: lib/types.ts

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
  platform: string; // <-- TAMBAHKAN INI
  profiles: Profile[];
  createdAt: Date;
  expiresAt: Date;
  reported?: boolean;
  reportReason?: string | null;
  isGaransiOnly?: boolean;
}

export interface GaransiAccount {
  id: string;
  email: string;
  password: string;
  type: AccountType;
  platform: string; // <-- TAMBAHKAN INI
  profiles: Profile[];
  createdAt: Date;
  expiresAt: Date;
  warrantyDate: Date;
}

export interface ReportedAccount {
  id: string;
  accountId: string;
  platform: string; // <-- TAMBAHKAN INI (opsional, tapi bagus untuk filtering laporan)
  email: string;
  reportReason: string;
  reportedAt: Date;
  resolved: boolean;
}

export interface CustomerAssignment {
  id: string;
  customerIdentifier: string;
  accountId: string;
  platform: string; // <-- TAMBAHKAN INI
  accountEmail: string;
  accountType: AccountType;
  profileName: string;
  operatorName?: string | null;
  assignedAt: Date;
}

export interface OperatorActivity {
  id: string;
  operatorName: string;
  action: string;
  platform: string; // <-- TAMBAHKAN INI
  accountEmail: string;
  accountType: AccountType;
  date: Date;
}

// Interface User tidak perlu platform
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "operator";
  createdAt: string;
}
