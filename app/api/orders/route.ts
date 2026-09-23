import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const orders = await getOrders(search, status);
  return NextResponse.json(orders);
}
