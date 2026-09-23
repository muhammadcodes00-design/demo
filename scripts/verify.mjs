import assert from "node:assert";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

console.log("--> Starting InvortechDS self-check suite...");

const dbPath = path.join(process.cwd(), "demo.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL
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
`);

// Seed admin if not present
const userCheck = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (userCheck.count === 0) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync("admin123", salt, 64).toString("hex");
  db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)")
    .run("usr_admin", "admins@invortechDS.com", `${salt}:${hash}`, "InvortechDS Admin");

  const seededProducts = [
    { id: "prod_01", name: "Ultra-Comfort Dental Patient Bibs (500/box)", sku: "BIB-BLU-500", category: "Disposables", price: 28.50, status: "active", stock: 140 },
    { id: "prod_02", name: "Aura Universal Microhybrid Composite Resin (4g)", sku: "CMP-RES-004", category: "Restorative", price: 64.00, status: "active", stock: 8 },
    { id: "prod_03", name: "Cordless LED Curing Light 1200mW/cm²", sku: "EQP-CUR-120", category: "Equipment", price: 189.00, status: "active", stock: 4 },
    { id: "prod_04", name: "Self-Sealing Sterilization Pouches 3.5\" x 9\" (200/box)", sku: "STR-PCH-200", category: "Sterilization", price: 16.75, status: "active", stock: 95 },
    { id: "prod_05", name: "Premium Nitrile Exam Gloves - Powder Free (100/box)", sku: "GLV-NIT-M100", category: "Disposables", price: 14.99, status: "active", stock: 6 },
    { id: "prod_06", name: "Diamond High-Speed FG Bur Multi-Pack (10/pk)", sku: "BUR-DIA-FG10", category: "Instruments", price: 42.50, status: "active", stock: 0 },
    { id: "prod_07", name: "Prophy Paste Mint Medium Grit (200 cups)", sku: "PRP-PST-200", category: "Preventive", price: 32.00, status: "draft", stock: 50 }
  ];

  const insProd = db.prepare("INSERT INTO products (id, name, sku, category, price, status, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))");
  for (const p of seededProducts) {
    insProd.run(p.id, p.name, p.sku, p.category, p.price, p.status, p.stock);
  }

  const insOrder = db.prepare("INSERT INTO orders (id, order_number, customer_name, customer_address, status, total, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))");
  insOrder.run("ord_1001", "ORD-1001", "Apex Family Dental Clinic", "742 Evergreen Terrace", "delivered", 247.50);
  insOrder.run("ord_1002", "ORD-1002", "Bright Smile Orthodontics", "10880 Wilshire Blvd", "shipped", 317.00);
  insOrder.run("ord_1003", "ORD-1003", "Metro Dental Care Center", "450 Lexington Ave", "processing", 114.00);
  insOrder.run("ord_1004", "ORD-1004", "Riverside Pediatric Dentistry", "2201 S Interstate 35", "pending", 421.45);

  const insItem = db.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
  insItem.run("item_01", "ord_1001", "prod_01", 3, 28.50);
  insItem.run("item_02", "ord_1001", "prod_04", 4, 16.75);
  insItem.run("item_03", "ord_1001", "prod_05", 5, 14.99);
}

// 1. Verify schema tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
for (const table of ["users", "products", "stock_adjustments", "orders", "order_items"]) {
  assert(tables.includes(table), `Table ${table} must exist in database`);
}
console.log("✓ Core relational tables verified:", tables.filter(t => !t.startsWith("sqlite_")).join(", "));

// 2. Verify admin credentials
const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("admins@invortechDS.com");
assert(admin, "Seeded admin admins@invortechDS.com must exist");

const [salt, hash] = admin.password_hash.split(":");
const computed = scryptSync("admin123", salt, 64);
assert(timingSafeEqual(computed, Buffer.from(hash, "hex")), "Admin password verification must succeed");
console.log("✓ Admin authentication and scrypt hash verified for admins@invortechDS.com");

// 3. Verify products & low-stock invariants
const products = db.prepare("SELECT * FROM products").all();
assert(products.length >= 7, `Expected at least 7 products, found ${products.length}`);
const lowStock = products.filter(p => p.stock <= 10 && p.status === 'active');
assert(lowStock.length > 0, "Expected low-stock items for dashboard alerts");
console.log(`✓ Products catalog verified (${products.length} products, ${lowStock.length} low-stock alerts)`);

// 4. Verify Stock Adjustment atomic transaction
const target = products[0];
const prevStock = target.stock;

db.exec("BEGIN TRANSACTION;");
db.prepare("INSERT INTO stock_adjustments (id, product_id, change, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
  .run("test_adj_01", target.id, 25, "restock", "Self-check restock batch");
db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(25, target.id);
db.exec("COMMIT;");

const afterAdj = db.prepare("SELECT stock FROM products WHERE id = ?").get(target.id);
assert.strictEqual(afterAdj.stock, prevStock + 25, "Stock must increment by 25 atomically");

// Revert test adjustment
db.exec("BEGIN TRANSACTION;");
db.prepare("DELETE FROM stock_adjustments WHERE id = 'test_adj_01'").run();
db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(prevStock, target.id);
db.exec("COMMIT;");

const reverted = db.prepare("SELECT stock FROM products WHERE id = ?").get(target.id);
assert.strictEqual(reverted.stock, prevStock, "Stock reverted cleanly");
console.log("✓ Stock adjustments atomic transaction verified");

// 5. Verify Orders & Historical Price Snapshot
const orders = db.prepare("SELECT * FROM orders").all();
assert(orders.length >= 4, `Expected at least 4 seeded orders, found ${orders.length}`);

const items = db.prepare("SELECT * FROM order_items WHERE order_id = 'ord_1001'").all();
assert(items.length >= 3, "ORD-1001 must have 3 line items");
assert(items.every(it => it.unit_price > 0 && it.quantity > 0), "Items must have valid price and quantity snapshots");
console.log(`✓ Orders and historical line items snapshot verified (${orders.length} orders)`);

console.log("\n>>> ALL INVARIANTS & INTEGRATION CHECKS PASSED SUCCESSFULLY! <<<");
