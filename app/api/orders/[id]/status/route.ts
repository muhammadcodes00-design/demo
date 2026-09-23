import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/data";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { status } = await req.json();
    const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !valid.includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    const updated = await updateOrderStatus(id, status);
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update status" }, { status: 500 });
  }
}
