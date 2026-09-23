import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}
