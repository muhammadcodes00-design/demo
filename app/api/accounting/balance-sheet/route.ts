import { NextRequest, NextResponse } from "next/server";
import { getBalanceSheet } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const asOf = req.nextUrl.searchParams.get("date") || undefined;
  const bs = await getBalanceSheet(asOf);
  return NextResponse.json(bs);
}
