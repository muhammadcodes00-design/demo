# InvortechDS — Admin Panel Prototype

A lightweight, high-performance web prototype for the InvortechDS Dental Supplies Admin Portal. Built with Next.js (App Router), Tailwind CSS, and zero-dependency SQLite storage (`node:sqlite`).

## Features
- **Dashboard**: Real-time sales, order counts, and automated low-stock warnings (≤ 10 units).
- **Products Catalog**: Complete CRUD management with search, status filters (active/draft), and thumbnail display.
- **Inventory & Stock Adjustments**: Atomic stock updates with reason codes (restock, damage, correction) and immediate recalculation.
- **Orders & Manifest**: Purchase order tracking with customer destination details, immutable price snapshots, and status transition lifecycle.
- **Authentication**: Session cookie-based auth protecting all admin views and APIs.

## Default Demo Credentials
- **Email**: `admins@invortechDS.com`
- **Password**: `admin123`

## Quick Start

```bash
# Install dependencies
npm install

# Run database & transaction self-check
npm test

# Run local development server
npm run dev

# Or build and run production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
