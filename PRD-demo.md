# Product Requirements Document (PRD)
## Prime Dental Supplies — Admin Panel Demo (Client Prototype)

**Version:** 1.0 (Demo Scope)
**Date:** September 23, 2026
**Status:** Draft — for client demo build

---

## 1. Overview

### 1.1 Purpose
A scoped-down, web-based build of the Prime Dental Supplies Admin Panel to demo to the
client and validate the core workflow before committing to the full desktop (Tauri)
build described in the main `architecture.md`. This is a **working clickable prototype**,
not a slide deck — every screen listed below should be built, not just mocked.

### 1.2 Relationship to the Full Product
This demo is a subset of the full Admin Panel scope (full PRD §3.13–3.30). It exists to:
- Let the client see and click through the core day-to-day workflow early
- De-risk the data model and UI decisions before the promotions, testimonials
  and other v1-full modules are built
- Ship fast: a browser-based React/Next.js app instead of a signed, distributed desktop
  installer

Everything **not** in the module list below (promotions/discount codes, testimonials,
tax settings, shipping settings, blog/content editor, user/account management, category
management) is explicitly **out of scope for this demo** and stays in the full-product
backlog. Accounting/bookkeeping **is** included (§3.9) because it demonstrates a core
piece of the client's day-to-day workflow, not just catalog/order management.

### 1.3 Target Users (Demo)
| Persona | Description | Key Needs in Demo |
|---|---|---|
| Practice/Business Owner (client) | Evaluating the product | Sees the real workflow, judges usability |
| Store Manager | Would use Dashboard/Orders day-to-day | Order status updates, low-stock visibility |
| Warehouse/Stock Staff | Would use Inventory | Fast stock adjustments |

---

## 2. Scope — Page Inventory (Demo)

| # | Page | Notes |
|---|---|---|
| 1 | Login | Single hardcoded/demo admin account is acceptable |
| 2 | Dashboard | Overview widgets only |
| 3 | Products — List | Searchable/filterable table |
| 4 | Products — Create/Edit | Single form |
| 5 | Inventory — Stock Overview | Per-SKU stock levels |
| 6 | Inventory — Stock Adjustment | Modal/drawer on top of Stock Overview |
| 7 | Orders — List | Searchable/filterable table |
| 8 | Orders — Detail | View + status update |
| 9 | Accounting — General Journal | Chronological list of all journal entries |
| 10 | Accounting — General Ledger | Entries grouped by account, running balance |
| 11 | Accounting — Trial Balance | Debits vs. credits self-check |
| 12 | Accounting — Balance Sheet | Assets/Liabilities/Equity as of a selected date |
| 13 | Accounting — New Manual Entry | Form for entries the system can't infer on its own |

**Explicitly excluded from this demo:** Category management, Blog/Content editor,
User/Account management, Tax Settings, Shipping Settings, Promotions, Testimonials, SEO
tools. (Full list and rationale: main `PRD.md` §2, §3.13–3.30.)

---

## 3. Functional Requirements

### 3.1 Login
- Email + password form
- No forgot-password flow needed for demo
- One seeded admin user is enough; role-based permission tiers (Admin/Manager/Editor/
  Support) are a full-product concern, not needed here

### 3.2 Dashboard
- Today's orders (count)
- Today's revenue (sum)
- Low-stock alert widget (SKUs below a threshold, pulled from real seeded data)
- Recent orders (last 5, clickable to Order Detail)
- Quick links to Products, Inventory, Orders

### 3.3 Products — List
- Table: image thumbnail, name, SKU, category (plain text field, not a managed taxonomy),
  price, stock, status (active/draft)
- Search by name/SKU
- Filter by status
- "Add Product" button → Create/Edit form

### 3.4 Products — Create/Edit
- Fields: name, SKU, description, price, category (free-text or simple dropdown from a
  fixed seeded list — no category management screen in the demo), single image upload,
  status (active/draft)
- Bulk-pricing tiers, SEO fields, CSV import/export: **out of scope for demo** (full PRD §3.14)
- Save → returns to Products List with the new/updated row visible

### 3.5 Inventory — Stock Overview
- Table: product name, SKU, current stock, status (in stock / low stock / out of stock)
- Low-stock threshold shown per row (can be a fixed global value for the demo)

### 3.6 Inventory — Stock Adjustment
- From a row, open an adjustment form: quantity change (+/-), reason (restock / damage /
  correction — simple dropdown), notes
- Adjustment updates the stock level immediately and is visible on the Stock Overview and
  Dashboard low-stock widget
- Audit log/history view of past adjustments: **nice-to-have, not required** for demo

### 3.7 Orders — List
- Table: order #, customer name, date, total, status (pending / processing / shipped /
  delivered / cancelled)
- Search by order # or customer name
- Filter by status

### 3.8 Orders — Detail
- Itemized line items (product, qty, price)
- Customer info (name, address, contact — display only, no editing)
- Status update control (dropdown or button group)
- Order total, tax (flat/display value is fine — configurable tax rules are full-product
  scope, main PRD §3.26)

---

## 4. Design Requirements
- Distinct admin visual identity from the storefront (matches the decision already locked
  in the main product: Slate Navy `#1e293b` / Action Blue `#2563eb`) — full palette and
  usage rules live in `design.md` if/when this demo graduates to the full build
- Clean, data-table-first UI — this is an internal tool, not a marketing surface
- Responsive is a nice-to-have; desktop-browser-first is fine for a client demo

---

## 5. Non-Functional Requirements (Demo)
- Runs in a browser, no installer needed for the client to see it
- Seeded/demo data is acceptable — does not need to connect to real Prime Dental Supplies
  production data
- No PCI/payment handling needed (orders are pre-seeded or manually created, not paid
  through a live gateway)
- No uptime/SLA targets — this is a demo environment, not production

---

## 6. Success Criteria for the Demo
- Client can log in and navigate all 8 screens without guidance
- Client can create a product, adjust its stock, and see the change reflected on the
  Dashboard and Inventory screens live
- Client can update an order's status and see it reflected in the Orders List
- Demo gives the client enough confidence to approve moving to the full build
  (Tauri desktop app + full module set per the main `PRD.md`/`architecture.md`)

---

## 7. Out of Scope (Demo)
- Everything in full `PRD.md` §3.13 platform note (Tauri desktop shell) — demo is web-only
- Accounting/Bookkeeping (§3.25), Tax Settings (§3.26), Shipping Settings (§3.27),
  Promotions (§3.28), Testimonials (§3.30), Blog/Content Editor, User/Account Management,
  Category Management
- Role-based permission tiers — single demo admin login only
- CSV import/export, bulk actions, SEO fields

---

## 8. Path to Full Product
This demo's data model (Products, Inventory, Orders) is designed to carry forward
directly into the full NestJS/PostgreSQL API described in the main `architecture.md` —
the demo's web frontend is a throwaway/prototype layer, but the underlying schema and API
contracts should be built as real, reusable pieces where practical, not disposable mocks.
