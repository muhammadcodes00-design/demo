import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  status: "active" | "draft";
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_address: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  order_count?: number;
  total_spend?: number;
}

export interface Account {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  created_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_name?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  source: "auto" | "manual";
  source_reference: string | null;
  memo: string;
  created_at: string;
  lines?: JournalLine[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getUser(email: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  return data || undefined;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, total, status, created_at")
    .order("created_at", { ascending: false });

  const orders = allOrders || [];
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const { data: lowStock } = await supabase
    .from("products")
    .select("id, name, sku, stock, category")
    .lte("stock", 10)
    .eq("status", "active")
    .order("stock", { ascending: true });

  return {
    todayOrders: todayOrders.length,
    todayRevenue,
    totalOrders: orders.length,
    totalRevenue,
    lowStockCount: lowStock ? lowStock.length : 0,
    lowStockItems: (lowStock as Product[]) || [],
    recentOrders: (orders.slice(0, 5) as Order[]),
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(search?: string, status?: string): Promise<Product[]> {
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (search?.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) || undefined;
}

export async function createProduct(data: {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price: number;
  image_url?: string;
  status: "active" | "draft";
}): Promise<Product> {
  const id = "prod_" + Math.random().toString(36).substring(2, 9);
  const newProd = {
    id,
    name: data.name,
    sku: data.sku.toUpperCase(),
    description: data.description || null,
    category: data.category || null,
    price: data.price,
    image_url: data.image_url || null,
    status: data.status,
    stock: 0,
  };
  const { data: created, error } = await supabase.from("products").insert(newProd).select().single();
  if (error) throw error;
  return created as Product;
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    sku: string;
    description?: string;
    category?: string;
    price: number;
    image_url?: string;
    status: "active" | "draft";
  }
) {
  const { data: updated, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      sku: data.sku.toUpperCase(),
      description: data.description || null,
      category: data.category || null,
      price: data.price,
      image_url: data.image_url || null,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return (updated as Product) || undefined;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getInventory() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, category, stock, status")
    .order("stock", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    stock_status: p.stock === 0 ? "out_of_stock" : p.stock <= 10 ? "low_stock" : "in_stock",
    threshold: 10,
  }));
}

export async function adjustStock(
  productId: string,
  change: number,
  reason: string,
  notes?: string
): Promise<{ success: boolean; newStock: number }> {
  const { data: prod } = await supabase
    .from("products")
    .select("stock, name, sku, price")
    .eq("id", productId)
    .single();
  if (!prod) throw new Error("Product not found");

  const newStock = Math.max(0, Number(prod.stock || 0) + change);
  const adjId = "adj_" + Math.random().toString(36).substring(2, 9);

  const { error: adjErr } = await supabase.from("stock_adjustments").insert({
    id: adjId,
    product_id: productId,
    change,
    reason,
    notes: notes || null,
  });
  if (adjErr) throw adjErr;

  const { error: upErr } = await supabase
    .from("products")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (upErr) throw upErr;

  if (reason === "restock" && change > 0) {
    const cost = +(Number(prod.price) * 0.6 * change).toFixed(2);
    const jeId = `je_${adjId}`;
    const d = new Date().toISOString().split("T")[0];
    await supabase.from("journal_entries").insert({
      id: jeId,
      entry_date: d,
      source: "auto",
      source_reference: `stock_adjustment:${adjId}`,
      memo: `Restock — ${prod.sku} x${change}`,
    });
    await supabase.from("journal_lines").insert([
      { id: `${jeId}_l1`, journal_entry_id: jeId, account_id: "acc_inv", debit: cost, credit: 0 },
      { id: `${jeId}_l2`, journal_entry_id: jeId, account_id: "acc_ap", debit: 0, credit: cost },
    ]);
  }

  return { success: true, newStock };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(search?: string, status?: string): Promise<Order[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (search?.trim()) {
    query = query.or(`order_number.ilike.%${search.trim()}%,customer_name.ilike.%${search.trim()}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as Order[]) || [];
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return undefined;
  const { data: items } = await supabase
    .from("order_items")
    .select("*, products(name, sku)")
    .eq("order_id", id);

  const formattedItems = (items || []).map((it: any) => ({
    id: it.id,
    order_id: it.order_id,
    product_id: it.product_id,
    product_name: it.products?.name,
    product_sku: it.products?.sku,
    quantity: it.quantity,
    unit_price: Number(it.unit_price),
  }));

  return { ...(order as Order), items: formattedItems };
}

export async function updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;

  if (status === "delivered") {
    const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
    if (order) {
      const { data: existing } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("source_reference", `order:${id}`)
        .limit(1);

      if (!existing || existing.length === 0) {
        const total = Number(order.total);
        const gst = +(total * 0.1).toFixed(2);
        const net = +(total - gst).toFixed(2);
        const cogs = +(total * 0.6).toFixed(2);
        const d = new Date().toISOString().split("T")[0];

        const revId = `je_${id}_rev`;
        await supabase.from("journal_entries").insert({
          id: revId,
          entry_date: d,
          source: "auto",
          source_reference: `order:${id}`,
          memo: `Sale — ${order.order_number}`,
        });
        await supabase.from("journal_lines").insert([
          { id: `${revId}_l1`, journal_entry_id: revId, account_id: "acc_cash", debit: total, credit: 0 },
          { id: `${revId}_l2`, journal_entry_id: revId, account_id: "acc_rev", debit: 0, credit: net },
          { id: `${revId}_l3`, journal_entry_id: revId, account_id: "acc_gst", debit: 0, credit: gst },
        ]);

        const cogsId = `je_${id}_cogs`;
        await supabase.from("journal_entries").insert({
          id: cogsId,
          entry_date: d,
          source: "auto",
          source_reference: `order:${id}`,
          memo: `COGS — ${order.order_number}`,
        });
        await supabase.from("journal_lines").insert([
          { id: `${cogsId}_l1`, journal_entry_id: cogsId, account_id: "acc_cogs", debit: cogs, credit: 0 },
          { id: `${cogsId}_l2`, journal_entry_id: cogsId, account_id: "acc_inv", debit: 0, credit: cogs },
        ]);
      }
    }
  }
  return getOrder(id);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(search?: string): Promise<Customer[]> {
  let query = supabase.from("customers").select("*, orders(id, total)").order("name", { ascending: true });
  if (search?.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    created_at: c.created_at,
    order_count: c.orders?.length || 0,
    total_spend: (c.orders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
  }));
}

export async function getCustomer(id: string): Promise<(Customer & { orders: Order[] }) | undefined> {
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) return undefined;
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  return { ...(customer as Customer), orders: (orders as Order[]) || [] };
}

export async function updateCustomerNotes(id: string, notes: string) {
  const { error } = await supabase.from("customers").update({ notes }).eq("id", id);
  if (error) throw error;
  return getCustomer(id);
}

// ─── Accounting ───────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as Account[]) || [];
}

export async function getJournal(from?: string, to?: string): Promise<JournalEntry[]> {
  let query = supabase
    .from("journal_entries")
    .select("*, journal_lines(*, accounts(name))")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("entry_date", from);
  if (to) query = query.lte("entry_date", to);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((e: any) => ({
    id: e.id,
    entry_date: e.entry_date,
    source: e.source,
    source_reference: e.source_reference,
    memo: e.memo,
    created_at: e.created_at,
    lines: (e.journal_lines || []).map((l: any) => ({
      id: l.id,
      journal_entry_id: l.journal_entry_id,
      account_id: l.account_id,
      account_name: l.accounts?.name || l.account_id,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    })),
  }));
}

export async function createJournalEntry(data: {
  entry_date: string;
  memo: string;
  lines: { account_id: string; debit: number; credit: number }[];
}) {
  const totalDebit = data.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = data.lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Entry is unbalanced: debits $${totalDebit.toFixed(2)} ≠ credits $${totalCredit.toFixed(2)}`);
  }

  const id = "je_" + Math.random().toString(36).substring(2, 9);
  const { error: jeError } = await supabase.from("journal_entries").insert({
    id,
    entry_date: data.entry_date,
    source: "manual",
    source_reference: null,
    memo: data.memo,
  });
  if (jeError) throw jeError;

  const linesToInsert = data.lines.map((l, i) => ({
    id: `${id}_l${i + 1}`,
    journal_entry_id: id,
    account_id: l.account_id,
    debit: l.debit || 0,
    credit: l.credit || 0,
  }));
  const { error: jlError } = await supabase.from("journal_lines").insert(linesToInsert);
  if (jlError) throw jlError;
  return id;
}

export async function getLedger(accountId: string, from?: string, to?: string) {
  const { data: account } = await supabase.from("accounts").select("*").eq("id", accountId).maybeSingle();
  if (!account) return null;

  const { data, error } = await supabase
    .from("journal_lines")
    .select("*, journal_entries(entry_date, memo, source, created_at)")
    .eq("account_id", accountId);
  if (error) throw error;

  let rows = (data || []).map((r: any) => ({
    id: r.id,
    journal_entry_id: r.journal_entry_id,
    account_id: r.account_id,
    debit: Number(r.debit || 0),
    credit: Number(r.credit || 0),
    entry_date: r.journal_entries?.entry_date,
    memo: r.journal_entries?.memo,
    source: r.journal_entries?.source,
    created_at: r.journal_entries?.created_at,
  }));

  if (from) rows = rows.filter((r) => r.entry_date >= from);
  if (to) rows = rows.filter((r) => r.entry_date <= to);
  rows.sort((a, b) => (a.entry_date + a.created_at).localeCompare(b.entry_date + b.created_at));

  let balance = 0;
  const withBalance = rows.map((r) => {
    balance += (r.debit || 0) - (r.credit || 0);
    return { ...r, balance };
  });

  return { account: account as Account, rows: withBalance };
}

export async function getTrialBalance() {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type")
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  const { data: lines } = await supabase.from("journal_lines").select("account_id, debit, credit");
  const accList = accounts || [];
  const lineList = lines || [];

  const rows = accList.map((a) => {
    const accLines = lineList.filter((l) => l.account_id === a.id);
    const total_debit = accLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const total_credit = accLines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      total_debit,
      total_credit,
    };
  });

  const sumDebit = rows.reduce((s, r) => s + r.total_debit, 0);
  const sumCredit = rows.reduce((s, r) => s + r.total_credit, 0);
  return { rows, sumDebit, sumCredit, balanced: Math.abs(sumDebit - sumCredit) < 0.01 };
}

export async function getBalanceSheet(asOf?: string) {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type")
    .in("type", ["asset", "liability", "equity"])
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const { data: lines } = await supabase
    .from("journal_lines")
    .select("account_id, debit, credit, journal_entries(entry_date)");

  let lineList = lines || [];
  if (asOf) {
    lineList = lineList.filter((l: any) => l.journal_entries?.entry_date <= asOf);
  }

  const rows = (accounts || []).map((a) => {
    const accLines = lineList.filter((l) => l.account_id === a.id);
    const total_debit = accLines.reduce((s, l: any) => s + Number(l.debit || 0), 0);
    const total_credit = accLines.reduce((s, l: any) => s + Number(l.credit || 0), 0);
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      total_debit,
      total_credit,
    };
  });

  const assets = rows.filter((r) => r.type === "asset");
  const liabilities = rows.filter((r) => r.type === "liability");
  const equity = rows.filter((r) => r.type === "equity");

  const totalAssets = assets.reduce((s, r) => s + r.total_debit - r.total_credit, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.total_credit - r.total_debit, 0);
  const totalEquity = equity.reduce((s, r) => s + r.total_credit - r.total_debit, 0);
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, balanced, asOf };
}
