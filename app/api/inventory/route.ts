import { NextResponse } from "next/server";
import { getInventory } from "@/lib/data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const inventory = getInventory();
    return NextResponse.json(inventory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch inventory" }, { status: 500 });
  }
}
