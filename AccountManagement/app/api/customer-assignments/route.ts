// app/api/customer-assignments/route.ts

import { NextResponse } from "next/server";
import { DatabaseService, AccountType } from "@/lib/database-service"; // Impor AccountType jika perlu
import { Prisma } from "@prisma/client"; // Impor Prisma untuk error handling
import { NextRequest } from "next/server";

export const runtime = "nodejs"; // Pastikan runtime nodejs jika menggunakan Prisma

/**
 * --------------------------------------------------------------------------------
 * 🔹 POST /api/customer-assignments
 * --------------------------------------------------------------------------------
 * Endpoint untuk membuat assignment baru (menugaskan akun ke customer).
 * Logika utama (validasi akun, pilih profil acak, update, log) ada di DatabaseService.addCustomerAssignment.
 *
 * @body {
 * customerIdentifier: string,
 * accountId: string,
 * accountEmail: string,
 * accountType: AccountType, // 'private' | 'sharing' | 'vip'
 * // profileName DIHAPUS DARI BODY
 * operatorName?: string
 * }
 * @returns { NextResponse } - Assignment yang baru dibuat atau pesan error.
 */
export async function POST(request: NextRequest) {
  try {
    // --- (Opsional tapi Direkomendasikan) Otentikasi & Otorisasi ---
    // Jika boss menggunakan middleware untuk otentikasi (seperti Clerk, NextAuth, atau custom),
    // boss bisa validasi token atau sesi di sini. Contoh dengan Clerk:
    // const { userId, sessionClaims } = getAuth(request);
    // if (!userId || !sessionClaims?.metadata?.role) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const operatorUsername = sessionClaims.metadata.username || "Unknown"; // Ambil username dari token/sesi
    // --- Akhir Otentikasi ---

    const body = await request.json();
    const {
      customerIdentifier,
      accountId,
      accountEmail,
      accountType,
      // profileName DIHAPUS dari destructuring
      operatorName, // Bisa undefined
    } = body;

    // 1. Validasi input dasar (profileName DIHAPUS dari cek)
    if (!customerIdentifier || !accountId || !accountEmail || !accountType) {
      return NextResponse.json(
        {
          error:
            "Missing required fields for assignment (customer, accountId, email, type).",
        },
        { status: 400 } // Bad Request
      );
    }

    // Validasi tipe akun (opsional, tapi bagus untuk keamanan)
    if (!["private", "sharing", "vip"].includes(accountType)) {
      return NextResponse.json(
        { error: `Invalid account type: ${accountType}` },
        { status: 400 }
      );
    }

    console.log(
      `[API] Attempting to assign account ${accountId} to customer "${customerIdentifier}" by operator "${
        operatorName ?? "System" // Jika pakai otentikasi, gunakan operatorUsername dari token/sesi
      }"`
    );

    // 2. Panggil DatabaseService.addCustomerAssignment (profileName DIHAPUS dari payload)
    // Fungsi ini sudah mencakup semua logika transaksi:
    // - Validasi akun
    // - Cari & pilih profil acak yang tersedia
    // - Membuat record assignment (dengan profileName yg dipilih server)
    // - Mencatat operator activity
    // - Mengupdate profil jadi 'used: true'
    const newAssignment = await DatabaseService.addCustomerAssignment({
      customerIdentifier,
      accountId,
      accountEmail,
      accountType: accountType as AccountType, // Pastikan tipe sesuai
      // profileName: profileName, <-- DIHAPUS
      operatorName: operatorName, // Jika pakai otentikasi, gunakan operatorUsername
    });

    console.log(
      `[API] Successfully created assignment ID: ${newAssignment.id} with profile ${newAssignment.profileName}` // Log profile yg dipilih server
    );

    // 3. Kembalikan respons sukses
    return NextResponse.json(newAssignment, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error("❌ [API] POST /api/customer-assignments error:", error);

    // Tangani error spesifik dari DatabaseService (misal: profil sudah dipakai / akun tidak ditemukan)
    if (
      error.message.includes("not found") ||
      error.message.includes("No available profiles") ||
      error.message.includes("Invalid profiles JSON")
    ) {
      // 409 Conflict cocok jika sumber daya tidak dalam kondisi yg diharapkan (misal, tidak ada profil)
      // 404 Not Found juga bisa jika accountId tidak ditemukan
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Tangani error Prisma lainnya jika perlu
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Contoh: error constraint unik
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Database constraint violation." },
          { status: 409 }
        );
      }
    }

    // Error umum
    return NextResponse.json(
      { error: "Failed to create customer assignment." },
      { status: 500 } // Internal Server Error
    );
  }
}

/**
 * --------------------------------------------------------------------------------
 * 🔹 GET /api/customer-assignments (Tidak Berubah)
 * --------------------------------------------------------------------------------
 * Endpoint untuk mengambil SEMUA history assignment.
 *
 * @returns { NextResponse } - Daftar semua assignment atau pesan error.
 */
export async function GET(request: NextRequest) {
  // Gunakan NextRequest
  try {
    // --- (Opsional) Otentikasi untuk GET ---
    // const { userId } = getAuth(request);
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // --- Akhir Otentikasi ---

    console.log("[API] Fetching all customer assignments history...");

    const assignments = await DatabaseService.getAllCustomerAssignments();

    console.log(`[API] Found ${assignments.length} total assignments.`);

    return NextResponse.json(assignments, { status: 200 }); // OK
  } catch (error: any) {
    console.error(
      "❌ [API] GET /api/customer-assignments error:",
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch assignment history." },
      { status: 500 }
    );
  }
}
