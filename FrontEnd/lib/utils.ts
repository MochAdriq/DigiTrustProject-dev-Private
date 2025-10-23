// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AccountType } from "@prisma/client";

/**
 * ✅ Merge Tailwind CSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ✅ Generate profiles and PINs based on account type.
 * - sharing: 20 profiles
 * - private: 8 profiles
 * - vip: 6 profiles
 *
 * @param type AccountType
 */
export function generateProfiles(type: AccountType) {
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

  const count = profileCounts[type];
  const profiles = Array.from({ length: count }).map((_, i) => ({
    profile: `Profile ${String.fromCharCode(65 + i)}`, // A, B, C, D...
    pin: pins[i % pins.length],
    used: false,
  }));

  // Optional randomization
  return [...profiles].sort(() => Math.random() - 0.5);
}

/**
 * ✅ Format a date into a readable string.
 * Example: 23 Okt 2025 (for id-ID)
 */
export function formatDate(dateString: string, locale = "id-ID"): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * ✅ Calculate expiration date (+23 days default)
 *
 * @param createdAt - The date account was created
 * @param customDays - Optional custom duration
 * @returns Date
 */
export function calculateExpirationDate(
  createdAt: Date | string,
  customDays?: number
): Date {
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) throw new Error("Invalid createdAt date");
  date.setDate(date.getDate() + (customDays ?? 23));
  return date;
}

/**
 * ✅ Simple UUID-like generator for client-side temp IDs.
 */
export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()}`;
}
