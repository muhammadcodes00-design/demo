import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/data";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const status = body.status;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const updated = updateOrderStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 500 });
  }
}
