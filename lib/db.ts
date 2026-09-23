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

  // Seed if users table is empty
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as unknown as { count: number }).count;
  if (userCount === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: DatabaseSync) {
  const adminId = "usr_" + Math.random().toString(36).substring(2, 9);
  const passwordHash = hashPassword("admin123");
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (?, ?, ?, ?)
  `).run(adminId, "admins@invortechDS.com", passwordHash, "InvortechDS Admin");

  const seededProducts = [
    {
      id: "prod_01",
      name: "Ultra-Comfort Dental Patient Bibs (500/box)",
      sku: "BIB-BLU-500",
      description: "3-ply waterproof dental patient bibs with embossed horizontal pattern and water repellent edge.",
      category: "Disposables",
      price: 28.50,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      status: "active",
      stock: 140,
    },
    {
      id: "prod_02",
      name: "Aura Universal Microhybrid Composite Resin (4g)",
      sku: "CMP-RES-004",
      description: "Light-curing, radiopaque microhybrid composite for anterior and posterior restorations with superior polishability.",
      category: "Restorative",
      price: 64.00,
      image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&q=80",
      status: "active",
      stock: 8, // Low stock (threshold is 10)
    },
    {
      id: "prod_03",
      name: "Cordless LED Curing Light 1200mW/cm²",
      sku: "EQP-CUR-120",
      description: "Ergonomic high-power cordless LED polymerization curing unit with 3 curing modes and digital timer.",
      category: "Equipment",
      price: 189.00,
      image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80",
      status: "active",
      stock: 4, // Low stock
    },
    {
      id: "prod_04",
      name: "Self-Sealing Sterilization Pouches 3.5\" x 9\" (200/box)",
      sku: "STR-PCH-200",
      description: "Internal and external chemical indicators with medical-grade paper and triple-seal security.",
      category: "Sterilization",
      price: 16.75,
      image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&q=80",
      status: "active",
      stock: 95,
    },
    {
      id: "prod_05",
      name: "Premium Nitrile Exam Gloves - Powder Free (100/box)",
      sku: "GLV-NIT-M100",
      description: "Textured fingertips for enhanced grip, latex-free barrier protection against pathogens and chemicals.",
      category: "Disposables",
      price: 14.99,
      image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80",
      status: "active",
      stock: 6, // Low stock
    },
    {
      id: "prod_06",
      name: "Diamond High-Speed FG Bur Multi-Pack (10/pk)",
      sku: "BUR-DIA-FG10",
      description: "Friction grip premium natural diamond burs for rapid cavity preparation and crown finishing.",
      category: "Instruments",
      price: 42.50,
      image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80",
      status: "active",
      stock: 0, // Out of stock
    },
    {
      id: "prod_07",
      name: "Prophy Paste Mint Medium Grit (200 cups)",
      sku: "PRP-PST-200",
      description: "Fluoride-releasing polishing paste with low splatter formulation and pleasant refreshing mint flavor.",
      category: "Preventive",
      price: 32.00,
      image_url: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&q=80",
      status: "draft",
      stock: 50,
    }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (id, name, sku, description, category, price, image_url, status, stock, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const p of seededProducts) {
    insertProd.run(p.id, p.name, p.sku, p.description, p.category, p.price, p.image_url, p.status, p.stock);
  }

  // Seed sample initial stock adjustments
  const insertAdj = db.prepare(`
    INSERT INTO stock_adjustments (id, product_id, change, reason, notes, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-2 days'))
  `);
  insertAdj.run("adj_01", "prod_01", 140, "restock", "Initial inventory intake batch A-1");
  insertAdj.run("adj_02", "prod_02", -2, "damage", "Damaged seal during transit inspection");

  // Seed sample orders
  const seededOrders = [
    {
      id: "ord_1001",
      order_number: "ORD-1001",
      customer_name: "Apex Family Dental Clinic (Dr. Elena Vance)",
      customer_address: "742 Evergreen Terrace, Suite 300, Springfield, IL 62704",
      status: "delivered",
      total: 247.50,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      items: [
        { product_id: "prod_01", quantity: 3, unit_price: 28.50 },
        { product_id: "prod_04", quantity: 4, unit_price: 16.75 },
        { product_id: "prod_05", quantity: 5, unit_price: 14.99 },
      ]
    },
    {
      id: "ord_1002",
      order_number: "ORD-1002",
      customer_name: "Bright Smile Orthodontics",
      customer_address: "10880 Wilshire Blvd #1400, Los Angeles, CA 90024",
      status: "shipped",
      total: 317.00,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      items: [
        { product_id: "prod_02", quantity: 2, unit_price: 64.00 },
        { product_id: "prod_03", quantity: 1, unit_price: 189.00 },
      ]
    },
    {
      id: "ord_1003",
      order_number: "ORD-1003",
      customer_name: "Metro Dental Care Center",
      customer_address: "450 Lexington Ave, 11th Fl, New York, NY 10017",
      status: "processing",
      total: 114.00,
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // today
      items: [
        { product_id: "prod_01", quantity: 4, unit_price: 28.50 },
      ]
    },
    {
      id: "ord_1004",
      order_number: "ORD-1004",
      customer_name: "Riverside Pediatric Dentistry",
      customer_address: "2201 S Interstate 35, Austin, TX 78741",
      status: "pending",
      total: 421.45,
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // today
      items: [
        { product_id: "prod_03", quantity: 2, unit_price: 189.00 },
        { product_id: "prod_05", quantity: 3, unit_price: 14.99 },
      ]
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, customer_name, customer_address, status, total, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const o of seededOrders) {
    insertOrder.run(o.id, o.order_number, o.customer_name, o.customer_address, o.status, o.total, o.created_at);
    let itemIdx = 1;
    for (const item of o.items) {
      insertOrderItem.run(`${o.id}_item_${itemIdx++}`, o.id, item.product_id, item.quantity, item.unit_price);
    }
  }
}
