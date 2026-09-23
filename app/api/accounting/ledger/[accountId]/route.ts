import { NextRequest, NextResponse } from "next/server";
import { getLedger } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { searchParams } = req.nextUrl;
  const result = await getLedger(accountId, searchParams.get("from") || undefined, searchParams.get("to") || undefined);
  if (!result) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return NextResponse.json(result);
}
