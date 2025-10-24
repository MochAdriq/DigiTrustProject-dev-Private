// app/api/accounts/route.ts

import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";

export const runtime = "nodejs"; // Prisma needs Node.js

export async function GET() {
  try {
    const accounts = await DatabaseService.getAllAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching main accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch main accounts" },
      { status: 500 }
    );
  }
}
