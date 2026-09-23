import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { hashPassword } from "./auth";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), "demo.db");
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      entry_date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      source_reference TEXT,
      memo TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0
    );
  `);

  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as unknown as { count: number }).count;
  if (userCount === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: DatabaseSync) {
  // Admin user
  db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)")
    .run("usr_admin", "admins@invortechDS.com", hashPassword("admin123"), "InvortechDS Admin");

  // Customers
  const customers = [
    { id: "cust_01", name: "Apex Family Dental Clinic (Dr. Elena Vance)", email: "billing@apexdental.com", phone: "+1-217-555-0101", address: "742 Evergreen Terrace, Suite 300, Springfield, IL 62704" },
    { id: "cust_02", name: "Bright Smile Orthodontics", email: "orders@brightsmile.com", phone: "+1-310-555-0182", address: "10880 Wilshire Blvd #1400, Los Angeles, CA 90024" },
    { id: "cust_03", name: "Metro Dental Care Center", email: "procurement@metrodental.com", phone: "+1-212-555-0143", address: "450 Lexington Ave, 11th Fl, New York, NY 10017" },
    { id: "cust_04", name: "Riverside Pediatric Dentistry", email: "admin@riversidepeds.com", phone: "+1-512-555-0167", address: "2201 S Interstate 35, Austin, TX 78741" },
    { id: "cust_05", name: "Suncoast Dental Partners", email: "info@suncoastdental.com", phone: "+1-813-555-0194", address: "4830 W Kennedy Blvd, Tampa, FL 33609" },
  ];

  const insCust = db.prepare("INSERT INTO customers (id, name, email, phone, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-60 days'))");
  for (const c of customers) {
    insCust.run(c.id, c.name, c.email, c.phone, c.address, null);
  }

  // Products
  const seededProducts = [
    { id: "prod_01", name: "Ultra-Comfort Dental Patient Bibs (500/box)", sku: "BIB-BLU-500", description: "3-ply waterproof dental patient bibs with embossed horizontal pattern and water repellent edge.", category: "Disposables", price: 28.50, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80", status: "active", stock: 140 },
    { id: "prod_02", name: "Aura Universal Microhybrid Composite Resin (4g)", sku: "CMP-RES-004", description: "Light-curing, radiopaque microhybrid composite for anterior and posterior restorations.", category: "Restorative", price: 64.00, image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&q=80", status: "active", stock: 8 },
    { id: "prod_03", name: "Cordless LED Curing Light 1200mW/cm²", sku: "EQP-CUR-120", description: "Ergonomic high-power cordless LED polymerization curing unit with 3 curing modes.", category: "Equipment", price: 189.00, image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80", status: "active", stock: 4 },
    { id: "prod_04", name: "Self-Sealing Sterilization Pouches 3.5\" x 9\" (200/box)", sku: "STR-PCH-200", description: "Internal and external chemical indicators with medical-grade paper and triple-seal security.", category: "Sterilization", price: 16.75, image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&q=80", status: "active", stock: 95 },
    { id: "prod_05", name: "Premium Nitrile Exam Gloves - Powder Free (100/box)", sku: "GLV-NIT-M100", description: "Textured fingertips for enhanced grip, latex-free barrier protection.", category: "Disposables", price: 14.99, image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80", status: "active", stock: 6 },
    { id: "prod_06", name: "Diamond High-Speed FG Bur Multi-Pack (10/pk)", sku: "BUR-DIA-FG10", description: "Friction grip premium natural diamond burs for rapid cavity preparation.", category: "Instruments", price: 42.50, image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80", status: "active", stock: 0 },
    { id: "prod_07", name: "Prophy Paste Mint Medium Grit (200 cups)", sku: "PRP-PST-200", description: "Fluoride-releasing polishing paste with low splatter formulation.", category: "Preventive", price: 32.00, image_url: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&q=80", status: "draft", stock: 50 }
  ];

  const insProd = db.prepare("INSERT INTO products (id, name, sku, description, category, price, image_url, status, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))");
  for (const p of seededProducts) {
    insProd.run(p.id, p.name, p.sku, p.description, p.category, p.price, p.image_url, p.status, p.stock);
  }

  // Initial stock adjustment history
  db.prepare("INSERT INTO stock_adjustments (id, product_id, change, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 days'))")
    .run("adj_01", "prod_01", 140, "restock", "Initial inventory intake batch A-1");
  db.prepare("INSERT INTO stock_adjustments (id, product_id, change, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 days'))")
    .run("adj_02", "prod_02", -2, "damage", "Damaged seal during transit inspection");

  // Orders with customer_id
  const seededOrders = [
    { id: "ord_1001", order_number: "ORD-1001", customer_id: "cust_01", customer_name: "Apex Family Dental Clinic (Dr. Elena Vance)", customer_address: "742 Evergreen Terrace, Suite 300, Springfield, IL 62704", status: "delivered", total: 247.50, daysAgo: 3 },
    { id: "ord_1002", order_number: "ORD-1002", customer_id: "cust_02", customer_name: "Bright Smile Orthodontics", customer_address: "10880 Wilshire Blvd #1400, Los Angeles, CA 90024", status: "shipped", total: 317.00, daysAgo: 1 },
    { id: "ord_1003", order_number: "ORD-1003", customer_id: "cust_03", customer_name: "Metro Dental Care Center", customer_address: "450 Lexington Ave, 11th Fl, New York, NY 10017", status: "processing", total: 114.00, hoursAgo: 4 },
    { id: "ord_1004", order_number: "ORD-1004", customer_id: "cust_04", customer_name: "Riverside Pediatric Dentistry", customer_address: "2201 S Interstate 35, Austin, TX 78741", status: "pending", total: 421.45, hoursAgo: 1 },
    { id: "ord_1005", order_number: "ORD-1005", customer_id: "cust_01", customer_name: "Apex Family Dental Clinic (Dr. Elena Vance)", customer_address: "742 Evergreen Terrace, Suite 300, Springfield, IL 62704", status: "delivered", total: 192.75, daysAgo: 7 },
  ];

  const insOrder = db.prepare("INSERT INTO orders (id, order_number, customer_id, customer_name, customer_address, status, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const o of seededOrders) {
    const createdAt = o.daysAgo
      ? new Date(Date.now() - o.daysAgo * 86400000).toISOString()
      : new Date(Date.now() - (o.hoursAgo || 1) * 3600000).toISOString();
    insOrder.run(o.id, o.order_number, o.customer_id, o.customer_name, o.customer_address, o.status, o.total, createdAt);
  }

  const insItem = db.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
  insItem.run("oi_1001_1", "ord_1001", "prod_01", 3, 28.50);
  insItem.run("oi_1001_2", "ord_1001", "prod_04", 4, 16.75);
  insItem.run("oi_1001_3", "ord_1001", "prod_05", 5, 14.99);
  insItem.run("oi_1002_1", "ord_1002", "prod_02", 2, 64.00);
  insItem.run("oi_1002_2", "ord_1002", "prod_03", 1, 189.00);
  insItem.run("oi_1003_1", "ord_1003", "prod_01", 4, 28.50);
  insItem.run("oi_1004_1", "ord_1004", "prod_03", 2, 189.00);
  insItem.run("oi_1004_2", "ord_1004", "prod_05", 3, 14.99);
  insItem.run("oi_1005_1", "ord_1005", "prod_04", 5, 16.75);
  insItem.run("oi_1005_2", "ord_1005", "prod_05", 7, 14.99);

  // Chart of Accounts
  const accounts = [
    { id: "acc_cash",   name: "Cash / Bank",         type: "asset" },
    { id: "acc_ar",     name: "Accounts Receivable",  type: "asset" },
    { id: "acc_inv",    name: "Inventory",            type: "asset" },
    { id: "acc_ap",     name: "Accounts Payable",     type: "liability" },
    { id: "acc_gst",    name: "GST Payable",          type: "liability" },
    { id: "acc_equity", name: "Owner's Equity",       type: "equity" },
    { id: "acc_rev",    name: "Sales Revenue",        type: "revenue" },
    { id: "acc_cogs",   name: "Cost of Goods Sold",   type: "expense" },
    { id: "acc_rent",   name: "Rent Expense",         type: "expense" },
    { id: "acc_wages",  name: "Wages Expense",        type: "expense" },
  ];

  const insAcc = db.prepare("INSERT INTO accounts (id, name, type, created_at) VALUES (?, ?, ?, datetime('now'))");
  for (const a of accounts) insAcc.run(a.id, a.name, a.type);

  // Seed journal entries for the two delivered orders (ORD-1001, ORD-1005)
  const deliveredOrders = [
    { orderId: "ord_1001", orderNum: "ORD-1001", total: 247.50, daysAgo: 3 },
    { orderId: "ord_1005", orderNum: "ORD-1005", total: 192.75, daysAgo: 7 },
  ];

  for (const o of deliveredOrders) {
    const entryDate = new Date(Date.now() - o.daysAgo * 86400000).toISOString().split("T")[0];
    const gst = +(o.total * 0.10).toFixed(2);
    const net = +(o.total - gst).toFixed(2);
    const entryId = `je_${o.orderId}_rev`;
    const createdAt = new Date(Date.now() - o.daysAgo * 86400000).toISOString();

    // Revenue entry
    db.prepare("INSERT INTO journal_entries (id, entry_date, source, source_reference, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(entryId, entryDate, "auto", `order:${o.orderId}`, `Sale — ${o.orderNum}`, createdAt);
    db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${entryId}_l1`, entryId, "acc_cash", o.total, 0);
    db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${entryId}_l2`, entryId, "acc_rev", 0, net);
    db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${entryId}_l3`, entryId, "acc_gst", 0, gst);

    // COGS entry
    const cogsId = `je_${o.orderId}_cogs`;
    db.prepare("INSERT INTO journal_entries (id, entry_date, source, source_reference, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(cogsId, entryDate, "auto", `order:${o.orderId}`, `COGS — ${o.orderNum}`, createdAt);
    db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${cogsId}_l1`, cogsId, "acc_cogs", o.total * 0.6, 0);
    db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${cogsId}_l2`, cogsId, "acc_inv", 0, o.total * 0.6);
  }

  // A few seeded manual entries
  const manualEntries = [
    { id: "je_rent_sep", date: "2026-09-01", memo: "September office rent", lines: [{ acc: "acc_rent", dr: 1800, cr: 0 }, { acc: "acc_cash", dr: 0, cr: 1800 }] },
    { id: "je_wages_sep", date: "2026-09-15", memo: "September wages — warehouse", lines: [{ acc: "acc_wages", dr: 3200, cr: 0 }, { acc: "acc_cash", dr: 0, cr: 3200 }] },
    { id: "je_equity_op", date: "2026-09-01", memo: "Owner capital contribution — initial setup", lines: [{ acc: "acc_cash", dr: 50000, cr: 0 }, { acc: "acc_equity", dr: 0, cr: 50000 }] },
  ];

  for (const e of manualEntries) {
    db.prepare("INSERT INTO journal_entries (id, entry_date, source, source_reference, memo, created_at) VALUES (?, ?, 'manual', NULL, ?, datetime(?))")
      .run(e.id, e.date, e.memo, `${e.date}T00:00:00.000Z`);
    for (let i = 0; i < e.lines.length; i++) {
      const l = e.lines[i];
      db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)")
        .run(`${e.id}_l${i + 1}`, e.id, l.acc, l.dr, l.cr);
    }
  }

  // Seeded restock journal entry for adj_01
  const restockEntryId = "je_adj_01_restock";
  const restockDate = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
  const restockCost = 140 * 28.50 * 0.6; // estimated cost
  db.prepare("INSERT INTO journal_entries (id, entry_date, source, source_reference, memo, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 days'))")
    .run(restockEntryId, restockDate, "auto", "stock_adjustment:adj_01", "Restock — BIB-BLU-500 x140 (Batch A-1)");
  db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${restockEntryId}_l1`, restockEntryId, "acc_inv", restockCost, 0);
  db.prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)").run(`${restockEntryId}_l2`, restockEntryId, "acc_ap", 0, restockCost);
}
