// app/api/operator-activities/route.ts

import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";

export const runtime = "nodejs"; // Prisma needs Node.js

export async function GET() {
  try {
    const activities = await DatabaseService.getAllOperatorActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching operator activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch operator activities" },
      { status: 500 }
    );
  }
}
