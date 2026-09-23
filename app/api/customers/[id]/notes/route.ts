import { NextRequest, NextResponse } from "next/server";
import { updateCustomerNotes } from "@/lib/data";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { notes } = await req.json();
  const updated = await updateCustomerNotes(id, notes ?? "");
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
