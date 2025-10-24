// app/api/statistics/profiles/[type]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DatabaseService, AccountType } from "@/lib/database-service";

export const runtime = "nodejs";

// Params type needed for route segments
type Params = {
  type: string; // The dynamic part [type] from the folder name
};

export async function GET(
  req: NextRequest,
  { params }: { params: Params } // Destructure params here
) {
  try {
    const accountType = params.type as AccountType; // Get type from URL segment

    // Validasi tipe akun
    if (
      accountType !== "private" &&
      accountType !== "sharing" &&
      accountType !== "vip"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid account type provided. Use 'private', 'sharing', or 'vip'.",
        },
        { status: 400 }
      );
    }

    // Panggil fungsi service di server
    const count = await DatabaseService.getAvailableProfileCount(accountType);

    // Kembalikan hanya jumlahnya
    return NextResponse.json({ count });
  } catch (error) {
    console.error(
      `Error fetching available profile count for ${params.type}:`,
      error
    );
    return NextResponse.json(
      { error: `Failed to fetch profile count for ${params.type}` },
      { status: 500 }
    );
  }
}
