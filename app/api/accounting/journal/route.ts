import { NextRequest, NextResponse } from "next/server";
import { getJournal, createJournalEntry, getAccounts } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const journal = await getJournal(searchParams.get("from") || undefined, searchParams.get("to") || undefined);
  return NextResponse.json(journal);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entry_date, memo, lines } = body;
    if (!entry_date || !memo || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({ error: "entry_date, memo, and at least 2 lines required" }, { status: 400 });
    }
    // Validate accounts exist
    const accounts = await getAccounts();
    const accountIds = new Set(accounts.map((a) => a.id));
    for (const l of lines) {
      if (!accountIds.has(l.account_id)) {
        return NextResponse.json({ error: `Unknown account: ${l.account_id}` }, { status: 400 });
      }
    }
    const id = await createJournalEntry({ entry_date, memo, lines });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 });
  }
}
