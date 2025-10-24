// app/api/accounts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  DatabaseService,
  AccountType,
  PlatformType,
} from "@/lib/database-service";
import { Prisma } from "@prisma/client"; // Import Prisma for error handling

export const runtime = "nodejs"; // Prisma needs Node.js

// --- PATCH: Update Akun Berdasarkan ID ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } } // Ambil ID dari params
) {
  try {
    const accountId = params.id;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Ambil data yang MUNGKIN diupdate (sesuai DatabaseService.updateAccount)
    const {
      email,
      password,
      expiresAt, // Terima sebagai string ISO
      // profiles, // Biasanya profiles tidak diupdate manual di sini
      platform,
    }: {
      email?: string;
      password?: string;
      expiresAt?: string;
      platform?: PlatformType;
    } = body;

    // Bangun objek data untuk dikirim ke service (hanya field yang ada)
    const updateData: {
      email?: string;
      password?: string;
      expiresAt?: Date; // Service butuh Date
      platform?: PlatformType;
    } = {};

    // Hati-hati dengan update email karena @unique
    // Saran: Nonaktifkan edit email di frontend jika memungkinkan
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (platform) updateData.platform = platform; // TODO: Validasi platform jika perlu
    if (expiresAt) {
      const expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiresAt date format." },
          { status: 400 }
        );
      }
      updateData.expiresAt = expiresAtDate;
    }

    // Cek jika tidak ada data valid untuk diupdate
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    console.log(`Updating account ${accountId} with data:`, updateData); // Log data update

    // Panggil DatabaseService.updateAccount
    const updatedAccount = await DatabaseService.updateAccount(
      accountId,
      updateData
    );

    // Handle jika akun tidak ditemukan oleh service (misal findUnique mengembalikan null)
    if (!updatedAccount) {
      return NextResponse.json(
        { error: `Account with ID ${accountId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAccount); // Kembalikan akun yang sudah diupdate
  } catch (error: any) {
    console.error(`Error updating account ${params.id}:`, error);
    // Handle error spesifik (misal email duplikat dari service)
    if (error.message.includes("already in use")) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }
    // Handle error jika akun tidak ditemukan (P2025 dari Prisma via service)
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}

// --- DELETE: Hapus Akun Berdasarkan ID ---
export async function DELETE(
  req: NextRequest, // req mungkin tidak digunakan tapi tetap parameter standar
  { params }: { params: { id: string } } // Ambil ID dari params
) {
  try {
    const accountId = params.id;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required." },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete account ${accountId}...`);

    // Panggil DatabaseService.deleteAccount
    // Fungsi ini sudah menggunakan transaksi untuk menghapus relasi
    await DatabaseService.deleteAccount(accountId);

    console.log(`Account ${accountId} deleted successfully.`);

    // Kembalikan response sukses tanpa body (standard untuk DELETE)
    // atau dengan pesan konfirmasi
    // return new NextResponse(null, { status: 204 }); // 204 No Content
    return NextResponse.json(
      { message: `Account ${accountId} deleted successfully.` },
      { status: 200 }
    ); // Atau 200 OK dengan pesan
  } catch (error: any) {
    console.error(`Error deleting account ${params.id}:`, error);
    // Handle error jika akun tidak ditemukan (dari service)
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
