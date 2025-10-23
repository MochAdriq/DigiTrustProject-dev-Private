// app/api/login/route.ts (DIPERBARUI)

import { NextRequest, NextResponse } from "next/server";
// ✅ Impor fungsi server dari file server baru
import { validateUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password diperlukan" },
        { status: 400 }
      );
    }

    // ✅ Panggil fungsi server-side di sini
    const user = await validateUser(username, password);

    if (user) {
      // Kirim data user (tanpa password) jika sukses
      return NextResponse.json(user, { status: 200 });
    } else {
      // Kirim error jika gagal
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 } // 401 Unauthorized
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
