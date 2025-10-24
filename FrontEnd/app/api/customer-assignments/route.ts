// app/api/customer-assignments/route.ts

import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";

export const runtime = "nodejs"; // Prisma needs Node.js

export async function GET() {
  try {
    const assignments = await DatabaseService.getAllCustomerAssignments();
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching customer assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer assignments" },
      { status: 500 }
    );
  }
}
