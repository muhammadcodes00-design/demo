import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

console.log("--> Starting InvortechDS Supabase Verification Suite...");

// Load .env.local if present
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rdeqnfwvbukijszcdiap.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

assert(supabaseKey, "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured");

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  // 1. Verify tables & connectivity
  const tables = [
    "users",
    "customers",
    "products",
    "stock_adjustments",
    "orders",
    "order_items",
    "accounts",
    "journal_entries",
    "journal_lines",
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    assert(!error, `Failed to query table ${table}: ${error?.message}`);
    assert(count !== null && count >= 0, `Table ${table} must be accessible`);
  }
  console.log("✓ Core Supabase tables verified:", tables.join(", "));

  // 2. Verify admin user
  const { data: admin, error: adminErr } = await supabase
    .from("users")
    .select("*")
    .ilike("email", "admins@invortechDS.com")
    .maybeSingle();

  assert(!adminErr && admin, "Admin user admins@invortechDS.com must exist in Supabase");
  const [salt, hash] = admin.password_hash.split(":");
  const computed = scryptSync("admin123", salt, 64);
  assert(timingSafeEqual(computed, Buffer.from(hash, "hex")), "Admin password verification must succeed");
  console.log("✓ Admin authentication and scrypt hash verified for admins@invortechDS.com");

  // 3. Verify customers
  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("*, orders(id, total)");
  assert(!custErr && customers && customers.length >= 5, `Expected >= 5 customers, found ${customers?.length}`);
  const withOrders = customers.filter((c) => c.orders && c.orders.length > 0);
  assert(withOrders.length >= 1, "Customers must have linked orders");
  console.log(`✓ Customers & CRM relations verified (${customers.length} customers, ${withOrders.length} with orders)`);

  // 4. Verify products
  const { data: products, error: prodErr } = await supabase.from("products").select("*");
  assert(!prodErr && products && products.length >= 7, `Expected >= 7 products, found ${products?.length}`);
  const lowStock = products.filter((p) => p.stock <= 10 && p.status === "active");
  assert(lowStock.length > 0, "Low stock items must exist for alert monitoring");
  console.log(`✓ Products catalog verified (${products.length} products, ${lowStock.length} low-stock alerts)`);

  // 5. Verify Chart of Accounts
  const { data: accounts, error: accErr } = await supabase.from("accounts").select("*");
  assert(!accErr && accounts && accounts.length >= 8, `Expected >= 8 accounts, found ${accounts?.length}`);
  const types = new Set(accounts.map((a) => a.type));
  for (const t of ["asset", "liability", "equity", "revenue", "expense"]) {
    assert(types.has(t), `Account type ${t} must exist in chart of accounts`);
  }
  console.log(`✓ Chart of accounts verified (${accounts.length} accounts across 5 core types)`);

  // 6. Verify Accounting Invariant: SUM(debit) == SUM(credit)
  const { data: entries, error: jeErr } = await supabase
    .from("journal_entries")
    .select("*, journal_lines(debit, credit)");
  assert(!jeErr && entries && entries.length >= 1, `Expected journal entries, found ${entries?.length}`);

  for (const entry of entries) {
    const lines = entry.journal_lines || [];
    const sumDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const sumCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    assert(
      Math.abs(sumDebit - sumCredit) < 0.01,
      `Journal entry ${entry.id} (${entry.memo}) must balance: Dr ${sumDebit} vs Cr ${sumCredit}`
    );
  }
  console.log(`✓ Double-entry balancing invariant verified across all ${entries.length} journal entries`);

  // 7. Verify Trial Balance consistency
  const { data: allLines, error: linesErr } = await supabase.from("journal_lines").select("debit, credit");
  assert(!linesErr && allLines, "Journal lines must be queryable");
  const totalDebit = allLines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = allLines.reduce((s, l) => s + Number(l.credit || 0), 0);
  assert(Math.abs(totalDebit - totalCredit) < 0.01, `Trial balance must balance: Dr ${totalDebit} == Cr ${totalCredit}`);
  console.log(`✓ Live Trial Balance verified balanced at $${totalDebit.toFixed(2)}`);

  console.log("\n>>> ALL SUPABASE VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
