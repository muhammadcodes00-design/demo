import { NextRequest, NextResponse } from "next/server";
import { adjustStock } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  try {
    const body = await req.json();
    const change = parseInt(body.change, 10);
    const reason = body.reason;
    const notes = body.notes;

    if (isNaN(change) || change === 0) {
      return NextResponse.json({ error: "A non-zero quantity change is required" }, { status: 400 });
    }

    if (!["restock", "damage", "correction"].includes(reason)) {
      return NextResponse.json({ error: "Invalid adjustment reason" }, { status: 400 });
    }

    const result = adjustStock(productId, change, reason, notes);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to adjust stock" }, { status: 500 });
  }
}
