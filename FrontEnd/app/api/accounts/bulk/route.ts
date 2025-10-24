import { NextRequest, NextResponse } from "next/server";
import {
  DatabaseService,
  AccountType,
  PlatformType,
} from "@/lib/database-service";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs"; // Prisma needs Node.js

// Tipe data yang diharapkan dari body request
interface BulkImportPayload {
  accounts: {
    email: string;
    password: string;
    type: AccountType;
    platform: PlatformType;
  }[];
  expiresAt: string; // Terima sebagai string ISO date
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accounts, expiresAt }: BulkImportPayload = body;

    // --- Validasi Input ---
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        {
          error: "Input 'accounts' harus berupa array dan tidak boleh kosong.",
        },
        { status: 400 }
      );
    }
    if (!expiresAt) {
      return NextResponse.json(
        { error: "Input 'expiresAt' diperlukan." },
        { status: 400 }
      );
    }

    // Konversi dan validasi tanggal expiresAt
    const expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        {
          error:
            "Format 'expiresAt' tidak valid. Gunakan format ISO date string.",
        },
        { status: 400 }
      );
    }

    // Validasi setiap item dalam array accounts (opsional tapi bagus)
    for (const acc of accounts) {
      if (!acc.email || !acc.password || !acc.type || !acc.platform) {
        return NextResponse.json(
          {
            error: `Data akun tidak lengkap ditemukan: ${JSON.stringify(acc)}`,
          },
          { status: 400 }
        );
      }
      if (!["private", "sharing", "vip"].includes(acc.type)) {
        return NextResponse.json(
          { error: `Tipe akun tidak valid: ${acc.type}` },
          { status: 400 }
        );
      }
      // TODO: Tambahkan validasi platform jika perlu
    }
    // --- Akhir Validasi Input ---

    console.log(
      `Attempting bulk import for ${
        accounts.length
      } accounts with expiry ${expiresAtDate.toISOString()}`
    );

    // Panggil DatabaseService.addMultipleAccounts
    // Fungsi ini sudah menghandle generateProfiles dan skipDuplicates
    const createdAccounts = await DatabaseService.addMultipleAccounts(
      accounts,
      expiresAtDate // Kirim sebagai Date object
    );

    // Berapa banyak yang benar-benar baru ditambahkan (karena skipDuplicates)
    // Kita bisa cek perbedaan panjang array input vs output, atau lihat log dari service
    // Untuk response, kita kembalikan saja jumlah yang berhasil di-query kembali
    const successCount = createdAccounts.length;
    console.log(
      `Successfully processed/retrieved ${successCount} accounts after bulk operation.`
    );

    return NextResponse.json(
      {
        message: `Bulk import processed. ${successCount} accounts relevant to this batch were retrieved.`,
        // Note: successCount might be less than accounts.length if duplicates were skipped
        // or if findMany has issues retrieving immediately after createMany (less likely)
        processedCount: successCount,
      },
      { status: 201 } // 201 Created (atau 200 OK jika lebih cocok)
    );
  } catch (error: any) {
    console.error("Error during bulk account import:", error);
    // Handle error spesifik jika perlu (misal: validasi gagal di service)
    return NextResponse.json(
      { error: error.message || "Failed to process bulk import" },
      { status: 500 } // Internal Server Error
    );
  }
}
