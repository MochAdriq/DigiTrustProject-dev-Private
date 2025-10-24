// app/api/reported-accounts/route.ts

import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";

export const runtime = "nodejs"; // Prisma needs Node.js

export async function GET() {
  try {
    const reportedAccounts = await DatabaseService.getAllReportedAccounts();
    return NextResponse.json(reportedAccounts);
  } catch (error) {
    console.error("Error fetching reported accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch reported accounts" },
      { status: 500 }
    );
  }
}
