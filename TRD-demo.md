# Technical Requirements Document (TRD)
## Prime Dental Supplies — Admin Panel Demo (Client Prototype)

**Version:** 1.0 (Demo Scope)
**Date:** September 23, 2026
**Companion docs:** `PRD-demo.md`, `app-flow-demo.md`, `architecture-demo.md`

---

## 1. Purpose
Technical spec for a working, web-based clickable prototype of the four core admin
modules (Dashboard, Products, Inventory, Orders), built fast enough to demo to the client
before committing to the full Tauri desktop build in the main `TRD.md`/`architecture.md`.

---

## 2. Tech Stack (Demo)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (React, App Router) | Same framework family as the storefront — keeps future team familiarity high |
| Styling | Tailwind CSS | Admin-only token set: Slate Navy `#1e293b` / Action Blue `#2563eb` |
| API Layer | Next.js API routes (or a minimal NestJS service if time allows) | No need for the full modular NestJS service split from the main architecture — one simple API layer is enough |
| Database | PostgreSQL (or SQLite for a purely local demo) | Real relational schema, even if hosted cheaply/locally for the demo |
| Auth | Single seeded admin user, simple session cookie or JWT | No OAuth/SSO, no role tiers |
| File/Image Storage | Local disk or S3 bucket | One product image per product is enough |
| Hosting | Vercel (frontend) + a small managed Postgres (e.g., Supabase/Neon/Railway) | Pick whichever gets a shareable URL fastest |
| CI/CD | Not required for demo | Manual deploy is fine; revisit for full build |

**Explicitly deferred to the full build:** Tauri desktop shell, Redis, Algolia/Elasticsearch,
Stripe, Avalara/TaxJar, EasyPost/ShipStation, Sentry/Datadog, GitHub Actions release
pipeline. None of these are needed to prove out the core workflow.

---

## 3. Data Model (Demo)

### 3.1 `products`
| Field | Type | Notes |
|---|---|---|
| id | UUID/serial | PK |
| name | string | required |
| sku | string | unique, required |
| description | text | optional |
| category | string | free text or fixed enum list, no separate category table |
| price | decimal | required |
| image_url | string | optional |
| status | enum(active, draft) | default: draft |
| stock | integer | current stock level, kept in sync with `stock_adjustments` |
| created_at / updated_at | timestamp | |

### 3.2 `stock_adjustments`
| Field | Type | Notes |
|---|---|---|
| id | UUID/serial | PK |
| product_id | FK → products | required |
| change | integer | signed (+/-) |
| reason | enum(restock, damage, correction) | required |
| notes | text | optional |
| created_at | timestamp | |

Applying an adjustment updates `products.stock` in the same transaction — never let the
displayed stock level and the adjustment history drift apart, even in the demo.

### 3.3 `orders`
| Field | Type | Notes |
|---|---|---|
| id | UUID/serial | PK |
| order_number | string | human-readable, e.g. `ORD-1001` |
| customer_name | string | display only in demo, no customer accounts table needed |
| customer_address | text | display only |
| status | enum(pending, processing, shipped, delivered, cancelled) | default: pending |
| total | decimal | sum of line items, computed at creation |
| created_at | timestamp | |

### 3.4 `order_items`
| Field | Type | Notes |
|---|---|---|
| id | UUID/serial | PK |
| order_id | FK → orders | required |
| product_id | FK → products | required |
| quantity | integer | required |
| unit_price | decimal | snapshot at time of order, not a live join to `products.price` |

**Why snapshot the price:** even in a demo, an order's historical total shouldn't change
if a product's price is edited later — this matches the immutability principle used
throughout the full product (see main `TRD.md`/`PRD.md` invoice-immutability notes).

---

## 4. API Endpoints (Demo)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Seeded admin login |
| GET | `/api/dashboard` | Today's orders, revenue, low-stock list, recent orders |
| GET | `/api/products` | List, with `?search=` and `?status=` |
| POST | `/api/products` | Create |
| GET | `/api/products/:id` | Detail |
| PUT | `/api/products/:id` | Update |
| GET | `/api/inventory` | Stock overview (joins products) |
| POST | `/api/inventory/:productId/adjust` | Create a stock adjustment, updates `products.stock` |
| GET | `/api/orders` | List, with `?search=` and `?status=` |
| GET | `/api/orders/:id` | Detail with line items |
| PUT | `/api/orders/:id/status` | Update order status |

All routes except `/api/auth/login` require a valid session — even a single-admin demo
should not ship with open endpoints.

---

## 5. Non-Functional Requirements (Demo)
- No load/scale testing needed — seeded data volume (tens of products/orders) is enough
  to demo the UI convincingly
- Basic input validation on forms (required fields, price/quantity as positive numbers)
  is required so the demo doesn't visibly break when the client tries it live
- No automated test suite required for the demo build itself, but the data model above
  should be treated as a real first draft of the full schema, not a disposable mock

---

## 6. Explicitly Deferred to Full Build
- Role-based access control (Admin/Manager/Editor/Support tiers)
- Real payment/tax/shipping integrations
- Search indexing (Algolia/Elasticsearch)
- Offline support / local caching (only relevant once this becomes a Tauri desktop app)
- Signed installers, auto-update, CI/CD release pipeline
- Audit logging beyond the basic `stock_adjustments` history
- Accounting/bookkeeping module, promotions, testimonials, blog/content, category
  management, user/account management (all full-product-only, per main `PRD.md`)
