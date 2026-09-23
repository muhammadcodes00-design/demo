# Architecture
## Prime Dental Supplies — Admin Panel Demo (Client Prototype)

**Version:** 1.0 (Demo Scope)
**Date:** September 23, 2026

---

## 1. Overview
A single deployable web application (frontend + lightweight API) covering four modules —
Dashboard, Products, Inventory, Orders — built to get a clickable, shareable URL in front
of the client quickly. This deliberately trades the full product's desktop-app,
microservice-ready architecture (main `architecture.md`) for the fastest reasonable path
to a convincing browser demo.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (React, App Router) | Server-rendered pages, no separate SPA build step |
| Styling | Tailwind CSS | Admin-only tokens: Slate Navy `#1e293b` / Action Blue `#2563eb` |
| API Layer | Next.js API routes | One codebase, one deploy — no separate backend service for the demo |
| Database | PostgreSQL (managed: Supabase/Neon/Railway) | Real relational schema, cheap to host |
| Auth | Single seeded admin user, JWT/session cookie | No role tiers, no OAuth |
| File Storage | S3-compatible bucket (or provider's built-in storage) | Product images only |
| Hosting | Vercel | One-click deploys, shareable preview URL for the client |
| CI/CD | Manual `git push` deploy via Vercel | No pipeline needed for a demo |

---

## 3. System Diagram

```
                    ┌───────────────────────┐
                    │        Client's        │
                    │  Browser (any device)  │
                    └───────────┬────────────┘
                                v
                    ┌───────────────────────┐
                    │   Next.js App (Vercel) │
                    │  Pages + API routes,    │
                    │  single deployable      │
                    └───────────┬────────────┘
                                v
                    ┌───────────────────────┐
                    │   PostgreSQL (managed) │
                    │  products, inventory,  │
                    │  orders, order_items   │
                    └───────────┬────────────┘
                                v
                    ┌───────────────────────┐
                    │  S3-compatible storage  │
                    │   (product images)      │
                    └───────────────────────┘
```

No separate services layer, no Redis, no search index, no payment/tax/shipping
integrations — all deferred to the full build (main `architecture.md` §2).

---

## 4. Module Boundaries (Demo)

| Module | Responsibility |
|---|---|
| Dashboard | Read-only aggregation over orders + products (counts, sums, recent rows) |
| Products | CRUD on `products` |
| Inventory | Read `products.stock`, write via `stock_adjustments` (never edits `products.stock` directly outside that flow) |
| Orders | Read/update `orders` + `order_items`, status transitions only (no order creation UI needed — orders can be seeded directly in the database for the demo) |

These four map directly onto the full product's Product, Inventory, and Order services
(main `architecture.md` §4) — the demo intentionally keeps the same boundaries so the
schema and API contracts can be lifted into the real NestJS services later rather than
rewritten from scratch.

---

## 5. Frontend Structure

```
/app
  /login/page.tsx
  /(admin)
    /dashboard/page.tsx
    /products/page.tsx              → List
    /products/new/page.tsx          → Create
    /products/[id]/page.tsx         → Edit
    /inventory/page.tsx             → Stock Overview (+ Adjustment modal)
    /orders/page.tsx                → List
    /orders/[id]/page.tsx           → Detail
  /api
    /auth/login/route.ts
    /dashboard/route.ts
    /products/route.ts
    /products/[id]/route.ts
    /inventory/route.ts
    /inventory/[productId]/adjust/route.ts
    /orders/route.ts
    /orders/[id]/route.ts
    /orders/[id]/status/route.ts
  /components                       → shared admin UI (tables, badges, modals, forms)
  /lib                              → db client, auth helpers, API utils
```

---

## 6. Data Flow Highlights
- **Stock adjustment:** Inventory screen → `POST /api/inventory/:productId/adjust` →
  transaction writes a `stock_adjustments` row and updates `products.stock` → response
  updates the row in place on the client, no full page reload needed.
- **Order status update:** Orders — Detail → `PUT /api/orders/:id/status` → `orders.status`
  updated → client re-fetches/updates the Orders List and Dashboard on next visit to those
  screens.
- **Product create/edit:** standard form submit → `POST`/`PUT /api/products` → redirect to
  Products — List with the change visible.

---

## 7. Environments
- **Local:** `next dev` against a local or free-tier managed Postgres instance
- **Demo/Client:** one Vercel deployment with a seeded managed Postgres database — this
  is the only environment this architecture needs to support

No staging/production split, no CI/CD gating — appropriate for a demo, not appropriate
once this graduates into the real product (at which point the main `architecture.md`'s
Local/Staging/Production model takes over).

---

## 8. Security (Demo-Appropriate Minimum)
- All `/api/*` routes except login require a valid session
- Passwords (even for the single seeded user) hashed, not stored in plaintext
- No public sign-up route — the demo admin account is seeded directly in the database
- Not required for demo, but required before any real client data ever touches this
  system: TLS (handled automatically by Vercel), and everything under main
  `architecture.md` §8 once this becomes the real product

---

## 9. Path to Full Build
This architecture is intentionally disposable at the infrastructure layer (Vercel +
Next.js API routes instead of Tauri + NestJS microservices) but the **data model and API
contracts are designed to survive** the transition — see `TRD-demo.md` §3–4 and
`architecture.md` §5.2 for what changes (desktop shell, service split, Redis, offline
cache) once the client approves moving past the demo.
