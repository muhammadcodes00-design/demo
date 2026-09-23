# App Flow
## Prime Dental Supplies — Admin Panel Demo (Client Prototype)

**Version:** 1.0 (Demo Scope)
**Date:** September 23, 2026

---

## 1. Entry Flow

```
Login
  │
  ├─ valid credentials ──▶ Dashboard
  └─ invalid credentials ─▶ Login (inline error, stay on page)
```

- No registration, forgot-password, or SSO flow in the demo — one seeded admin account.

---

## 2. Primary Navigation

From any authenticated screen, a persistent sidebar/topbar links to:
```
Dashboard | Products | Inventory | Orders | (Logout)
```

---

## 3. Dashboard Flow

```
Dashboard
  ├─ "Low Stock" widget row ──▶ Inventory — Stock Overview (filtered/scrolled to that SKU)
  ├─ "Recent Orders" row ─────▶ Orders — Detail (for that order)
  ├─ "Add Product" quick link ▶ Products — Create
  └─ "View All Orders" ───────▶ Orders — List
```

---

## 4. Products Flow

```
Products — List
  ├─ "Add Product" ──────────▶ Products — Create
  │                              ├─ Save ──▶ back to Products — List (new row visible, toast confirmation)
  │                              └─ Cancel ▶ back to Products — List (no changes saved)
  ├─ click a row ─────────────▶ Products — Edit (same form, pre-filled)
  │                              ├─ Save ──▶ back to Products — List (row updated)
  │                              └─ Cancel ▶ back to Products — List (no changes saved)
  ├─ search box ──────────────▶ filters table in place
  └─ status filter ───────────▶ filters table in place
```

**Note:** creating/editing a product does not touch `stock` directly — stock is only
changed via the Inventory — Stock Adjustment flow (§5), keeping a single source of truth
for stock changes even in the demo.

---

## 5. Inventory Flow

```
Inventory — Stock Overview
  ├─ click "Adjust" on a row ─▶ Stock Adjustment (modal/drawer, same page underneath)
  │                              ├─ enter change, reason, notes
  │                              ├─ Save ──▶ modal closes, row's stock updates immediately,
  │                              │           Dashboard low-stock widget reflects it on next visit
  │                              └─ Cancel ▶ modal closes, no changes
  └─ status badges (in stock / low stock / out of stock) update live from `products.stock`
```

---

## 6. Orders Flow

```
Orders — List
  ├─ search / status filter ──▶ filters table in place
  └─ click a row ──────────────▶ Orders — Detail
                                   ├─ view line items, customer info, total
                                   ├─ change status (dropdown/buttons)
                                   │    └─ Save ──▶ status updates, badge changes on this
                                   │                page and reflects back in Orders — List
                                   │                and the Dashboard "Recent Orders" widget
                                   └─ back arrow ──▶ Orders — List
```

---

## 7. Cross-Screen State Rules
- A stock adjustment made on Inventory is reflected on the Dashboard low-stock widget and
  on the Products List's stock column without needing a manual refresh (or at minimum, on
  next navigation — a full real-time push is not required for the demo).
- An order status change made on Orders — Detail is reflected on Orders — List and the
  Dashboard "Recent Orders" widget the same way.
- Logging out from anywhere returns to Login and clears the session.

---

## 8. What's Deliberately Not Mapped
No flow diagrams are included here for Category Management, Blog/Content, User/Account
Management, Accounting, Tax/Shipping Settings, Promotions, or Testimonials — these modules
are out of scope for this demo (see `PRD-demo.md` §7) and their flows already exist in the
main product's planning docs for when the full build starts.
