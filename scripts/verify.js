import assert from "node:assert";
import { getDb } from "../lib/db.ts";
import { verifyPassword } from "../lib/auth.ts";
import { 
  getUser, 
  getDashboardStats, 
  getProducts, 
  adjustStock, 
  updateOrderStatus, 
  getProduct,
  getOrder 
} from "../lib/data.ts";

console.log("Running InvortechDS self-check suite...");

// 1. Verify DB initialization
const db = getDb();
assert(db, "Database should initialize");

// 2. Verify admin credentials
const user = getUser("admins@invortechDS.com");
assert(user, "Admin user must be seeded");
assert(verifyPassword("admin123", user.password_hash), "Password verification failed");
assert(!verifyPassword("wrongpass", user.password_hash), "Password verification should reject wrong password");
console.log("✓ Admin auth and password hashing verified");

// 3. Verify Products and Dashboard stats
const products = getProducts();
assert(products.length >= 7, `Expected at least 7 seeded products, got ${products.length}`);
const stats = getDashboardStats();
assert(stats.todayOrders >= 0, "Dashboard stats should have todayOrders");
assert(stats.lowStockCount > 0, "Expected low stock products in seeded data");
console.log(`✓ Products (${products.length}) and Dashboard stats verified`);

// 4. Verify Stock Adjustment atomic transaction
const testProd = products[0];
const initialStock = testProd.stock;
const adjResult = adjustStock(testProd.id, 15, "restock", "Verification restock batch");
assert.strictEqual(adjResult.newStock, initialStock + 15, "Stock adjustment should increment stock");

const updatedProd = getProduct(testProd.id);
assert.strictEqual(updatedProd?.stock, initialStock + 15, "Product record must match adjustment");

// Rollback stock for clean state
adjustStock(testProd.id, -15, "correction", "Verification cleanup");
const restoredProd = getProduct(testProd.id);
assert.strictEqual(restoredProd?.stock, initialStock, "Product stock should restore cleanly");
console.log("✓ Stock adjustment atomic transactions verified");

// 5. Verify Order Status updates
const sampleOrder = getOrder("ord_1004");
assert(sampleOrder, "Order ORD-1004 should exist");
assert(sampleOrder.items && sampleOrder.items.length > 0, "Order should have itemized items");

updateOrderStatus("ord_1004", "processing");
const updatedOrder = getOrder("ord_1004");
assert.strictEqual(updatedOrder?.status, "processing", "Order status should update to processing");

updateOrderStatus("ord_1004", "pending");
console.log("✓ Order status update transitions verified");

console.log("\nAll checks passed successfully!");
