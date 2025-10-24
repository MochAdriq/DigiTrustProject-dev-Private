// app/api/garansi-accounts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";
import type { AccountType, PlatformType } from "@/lib/database-service"; // Import tipe

export const runtime = "nodejs"; // Prisma needs Node.js

// --- GET: Ambil Semua Akun Garansi ---
export async function GET() {
  try {
    const garansiAccounts = await DatabaseService.getAllGaransiAccounts();
    return NextResponse.json(garansiAccounts);
  } catch (error) {
    console.error("Error fetching garansi accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch garansi accounts" },
      { status: 500 }
    );
  }
}

// --- POST: Tambah Akun Garansi Baru ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      accounts,
      expiresAt,
    }: {
      accounts: {
        email: string;
        password: string;
        type: AccountType;
        platform: PlatformType; // Pastikan tipe benar
      }[];
      expiresAt: string; // Terima sebagai string ISO
    } = body;

    // Validasi input dasar
    if (
      !accounts ||
      !Array.isArray(accounts) ||
      accounts.length === 0 ||
      !expiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid input: 'accounts' array and 'expiresAt' are required.",
        },
        { status: 400 }
      );
    }

    // Panggil service (service sudah mengharapkan Date object)
    const result = await DatabaseService.addGaransiAccounts(
      accounts,
      new Date(expiresAt) // Konversi string ISO kembali ke Date
    );

    return NextResponse.json(
      { message: "Garansi accounts added successfully", count: result.length },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    console.error("Error adding garansi accounts:", error);
    // Berikan pesan error yang lebih spesifik jika memungkinkan
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add garansi accounts";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
