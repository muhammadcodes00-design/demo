import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const customers = await getCustomers(search);
  return NextResponse.json(customers);
}
