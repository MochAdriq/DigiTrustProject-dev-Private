// app/api/accounts/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  DatabaseService,
  AccountType,
  PlatformType,
} from "@/lib/database-service"; // Import tipe juga

export const runtime = "nodejs"; // Prisma needs Node.js

// --- GET: Ambil Akun (dengan filter opsional) ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountType = searchParams.get("type") as AccountType | null; // Ambil query param 'type'

    let accounts;
    if (accountType && ["private", "sharing", "vip"].includes(accountType)) {
      // Jika ada filter type yang valid, panggil getAccountsByType
      console.log(`Fetching accounts with type: ${accountType}`);
      accounts = await DatabaseService.getAccountsByType(accountType);
    } else {
      // Jika tidak ada filter atau filter tidak valid, ambil semua
      console.log("Fetching all accounts (no valid type filter)");
      accounts = await DatabaseService.getAllAccounts();
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching main accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch main accounts" },
      { status: 500 }
    );
  }
}

// --- POST: Tambah Akun Baru ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ambil semua data yang dibutuhkan oleh DatabaseService.addAccount
    const {
      email,
      password,
      type,
      platform,
      expiresAt, // Ini bisa string ISO date dari client
    }: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
      expiresAt?: string; // Terima sebagai string, bisa undefined
    } = body;

    // Validasi input
    if (!email || !password || !type || !platform) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: email, password, type, platform are required.",
        },
        { status: 400 }
      );
    }
    if (!["private", "sharing", "vip"].includes(type)) {
      return NextResponse.json(
        { error: `Invalid account type: ${type}` },
        { status: 400 }
      );
    }
    // TODO: Tambahkan validasi untuk platform jika perlu

    // Konversi expiresAt string ke Date object jika ada
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiresAt date format." },
        { status: 400 }
      );
    }

    // Panggil DatabaseService.addAccount
    // Fungsi ini sudah otomatis generate profiles
    const newAccount = await DatabaseService.addAccount({
      email,
      password,
      type,
      platform,
      expiresAt: expiresAtDate, // Kirim Date object atau undefined
    });

    return NextResponse.json(newAccount, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error("Error adding main account:", error);
    // Handle error spesifik (misal email duplikat dari service)
    if (error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json(
      { error: error.message || "Failed to add main account" },
      { status: 500 }
    );
  }
}
