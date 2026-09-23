import { NextRequest, NextResponse } from "next/server";
import { adjustStock } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  try {
    const { change, reason, notes } = await req.json();
    if (!change || change === 0) return NextResponse.json({ error: "Change amount required" }, { status: 400 });
    if (!["restock", "damage", "correction"].includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }
    const result = await adjustStock(productId, Number(change), reason, notes);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Adjustment failed" }, { status: 500 });
  }
}
