import { NextResponse } from "next/server";
import { getTrialBalance } from "@/lib/data";

export const runtime = "nodejs";

export async function GET() {
  const tb = await getTrialBalance();
  return NextResponse.json(tb);
}
