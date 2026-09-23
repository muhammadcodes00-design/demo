import { getDb } from "./db";

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

export interface StockAdjustment {
  id: string;
  product_id: string;
  change: number;
  reason: "restock" | "damage" | "correction";
  notes: string | null;
  created_at: string;
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
  customer_name: string;
  customer_address: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export function getUser(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email.trim()) as unknown as {
    id: string;
    email: string;
    password_hash: string;
    name: string;
  } | undefined;
}

export function getDashboardStats() {
  const db = getDb();
  
  // Today's orders count and revenue sum
  const todayRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders
    WHERE date(created_at) = date('now')
  `).get() as unknown as { count: number; revenue: number };

  // All time total orders fallback if today is 0 for demo visual richness
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders
  `).get() as unknown as { count: number; revenue: number };

  // Low stock products (stock <= 10)
  const lowStockProducts = db.prepare(`
    SELECT id, name, sku, stock, category
    FROM products
    WHERE stock <= 10 AND status = 'active'
    ORDER BY stock ASC
  `).all() as unknown as Product[];

  // Recent 5 orders
  const recentOrders = db.prepare(`
    SELECT id, order_number, customer_name, total, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as unknown as Order[];

  return {
    todayOrders: todayRow.count,
    todayRevenue: todayRow.revenue,
    totalOrders: totalRow.count,
    totalRevenue: totalRow.revenue,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts,
    recentOrders,
  };
}

export function getProducts(search?: string, status?: string) {
  const db = getDb();
  let query = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];

  if (search && search.trim()) {
    query += " AND (name LIKE ? OR sku LIKE ?)";
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard);
  }

  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";
  return db.prepare(query).all(...params) as unknown as Product[];
}

export function getProduct(id: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) as unknown as Product | undefined;
}

export function createProduct(data: {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price: number;
  image_url?: string;
  status: "active" | "draft";
}) {
  const db = getDb();
  const id = "prod_" + Math.random().toString(36).substring(2, 9);
  
  db.prepare(`
    INSERT INTO products (id, name, sku, description, category, price, image_url, status, stock, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
  `).run(
    id,
    data.name,
    data.sku.toUpperCase(),
    data.description || null,
    data.category || null,
    data.price,
    data.image_url || null,
    data.status
  );

  return getProduct(id)!;
}

export function updateProduct(id: string, data: {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price: number;
  image_url?: string;
  status: "active" | "draft";
}) {
  const db = getDb();
  db.prepare(`
    UPDATE products
    SET name = ?, sku = ?, description = ?, category = ?, price = ?, image_url = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.name,
    data.sku.toUpperCase(),
    data.description || null,
    data.category || null,
    data.price,
    data.image_url || null,
    data.status,
    id
  );

  return getProduct(id);
}

export function getInventory() {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, sku, category, stock, status,
           CASE 
             WHEN stock = 0 THEN 'out_of_stock'
             WHEN stock <= 10 THEN 'low_stock'
             ELSE 'in_stock'
           END as stock_status,
           10 as threshold
    FROM products
    ORDER BY stock ASC, name ASC
  `).all();
}

export function adjustStock(productId: string, change: number, reason: string, notes?: string) {
  const db = getDb();
  const adjId = "adj_" + Math.random().toString(36).substring(2, 9);

  // In SQLite with DatabaseSync, execute operations atomically
  db.exec("BEGIN TRANSACTION;");
  try {
    const prod = db.prepare("SELECT stock FROM products WHERE id = ?").get(productId) as unknown as { stock: number } | undefined;
    if (!prod) {
      throw new Error("Product not found");
    }

    const newStock = Math.max(0, prod.stock + change);

    db.prepare(`
      INSERT INTO stock_adjustments (id, product_id, change, reason, notes, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(adjId, productId, change, reason, notes || null);

    db.prepare(`
      UPDATE products
      SET stock = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStock, productId);

    db.exec("COMMIT;");
    return { success: true, newStock };
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

export function getOrders(search?: string, status?: string) {
  const db = getDb();
  let query = "SELECT * FROM orders WHERE 1=1";
  const params: any[] = [];

  if (search && search.trim()) {
    query += " AND (order_number LIKE ? OR customer_name LIKE ?)";
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard);
  }

  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";
  return db.prepare(query).all(...params) as unknown as Order[];
}

export function getOrder(id: string) {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as unknown as Order | undefined;
  if (!order) return undefined;

  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.sku as product_sku
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(id) as unknown as OrderItem[];

  return {
    ...order,
    items,
  };
}

export function updateOrderStatus(id: string, status: string) {
  const db = getDb();
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return getOrder(id);
}
