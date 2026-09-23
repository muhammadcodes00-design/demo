-- ==============================================================================
-- InvortechDS Database Migration: SQLite -> Supabase (PostgreSQL)
-- Project: rdeqnfwvbukijszcdiap
-- ==============================================================================

-- 1. Users Table (Admin authentication)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Customers Table (CRM Module)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Products Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Stock Adjustments Table
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('restock', 'damage', 'correction')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 7. Chart of Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. General Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id TEXT PRIMARY KEY,
  entry_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('auto', 'manual')),
  source_reference TEXT,
  memo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Journal Lines Table (Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS public.journal_lines (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  credit NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON public.journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_lines(account_id);

-- Enable Row Level Security (RLS) on all tables as per Supabase Best Practices
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon/authenticated service roles in prototype demo
CREATE POLICY "Allow public read-write for demo users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo stock_adjustments" ON public.stock_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo journal_lines" ON public.journal_lines FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Seed Data
-- ==============================================================================

-- 1. Admin User
INSERT INTO public.users (id, email, password_hash, name)
VALUES (
  'usr_admin', 
  'admins@invortechDS.com', 
  'bd3e393713a761b498399b96af391435:3b4a024150a758bcd44b374a969d42fc70802a38706b1bdac0f32871ddf410fdf84286e0415cdef0b0fdf3d49a2c85c6e134f47b04f41cd03245492d2b60376c', 
  'InvortechDS Admin'
) ON CONFLICT (id) DO NOTHING;

-- 2. Customers
INSERT INTO public.customers (id, name, email, phone, address, notes, created_at)
VALUES 
  ('cust_01', 'Apex Family Dental Clinic (Dr. Elena Vance)', 'billing@apexdental.com', '+1-217-555-0101', '742 Evergreen Terrace, Suite 300, Springfield, IL 62704', 'Doctor requested net-30 billing cycle.', now() - interval '60 days'),
  ('cust_02', 'Bright Smile Orthodontics', 'orders@brightsmile.com', '+1-310-555-0182', '10880 Wilshire Blvd #1400, Los Angeles, CA 90024', 'Prefers shipments delivered to suite back door before 11 AM.', now() - interval '45 days'),
  ('cust_03', 'Metro Dental Care Center', 'procurement@metrodental.com', '+1-212-555-0143', '450 Lexington Ave, 11th Fl, New York, NY 10017', 'Large group practice. High volume disposable gloves and bibs.', now() - interval '30 days'),
  ('cust_04', 'Riverside Pediatric Dentistry', 'admin@riversidepeds.com', '+1-512-555-0167', '2201 S Interstate 35, Austin, TX 78741', 'Requires child-friendly flavored prophy pastes.', now() - interval '20 days'),
  ('cust_05', 'Suncoast Dental Partners', 'info@suncoastdental.com', '+1-813-555-0194', '4830 W Kennedy Blvd, Tampa, FL 33609', 'Standing order discussions in progress.', now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO public.products (id, name, sku, description, category, price, image_url, status, stock, created_at, updated_at)
VALUES 
  ('prod_01', 'Ultra-Comfort Dental Patient Bibs (500/box)', 'BIB-BLU-500', '3-ply waterproof dental patient bibs with embossed horizontal pattern and water repellent edge.', 'Disposables', 28.50, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 'active', 140, now(), now()),
  ('prod_02', 'Aura Universal Microhybrid Composite Resin (4g)', 'CMP-RES-004', 'Light-curing, radiopaque microhybrid composite for anterior and posterior restorations.', 'Restorative', 64.00, 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&q=80', 'active', 8, now(), now()),
  ('prod_03', 'Cordless LED Curing Light 1200mW/cm²', 'EQP-CUR-120', 'Ergonomic high-power cordless LED polymerization curing unit with 3 curing modes.', 'Equipment', 189.00, 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80', 'active', 4, now(), now()),
  ('prod_04', 'Self-Sealing Sterilization Pouches 3.5" x 9" (200/box)', 'STR-PCH-200', 'Internal and external chemical indicators with medical-grade paper and triple-seal security.', 'Sterilization', 16.75, 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&q=80', 'active', 95, now(), now()),
  ('prod_05', 'Premium Nitrile Exam Gloves - Powder Free (100/box)', 'GLV-NIT-M100', 'Textured fingertips for enhanced grip, latex-free barrier protection.', 'Disposables', 14.99, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80', 'active', 6, now(), now()),
  ('prod_06', 'Diamond High-Speed FG Bur Multi-Pack (10/pk)', 'BUR-DIA-FG10', 'Friction grip premium natural diamond burs for rapid cavity preparation.', 'Instruments', 42.50, 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80', 'active', 0, now(), now()),
  ('prod_07', 'Prophy Paste Mint Medium Grit (200 cups)', 'PRP-PST-200', 'Fluoride-releasing polishing paste with low splatter formulation.', 'Preventive', 32.00, 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&q=80', 'draft', 50, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Stock Adjustments
INSERT INTO public.stock_adjustments (id, product_id, change, reason, notes, created_at)
VALUES 
  ('adj_01', 'prod_01', 140, 'restock', 'Initial inventory intake batch A-1', now() - interval '2 days'),
  ('adj_02', 'prod_02', -2, 'damage', 'Damaged seal during transit inspection', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Orders
INSERT INTO public.orders (id, order_number, customer_id, customer_name, customer_address, status, total, created_at)
VALUES 
  ('ord_1001', 'ORD-1001', 'cust_01', 'Apex Family Dental Clinic (Dr. Elena Vance)', '742 Evergreen Terrace, Suite 300, Springfield, IL 62704', 'delivered', 247.50, now() - interval '3 days'),
  ('ord_1002', 'ORD-1002', 'cust_02', 'Bright Smile Orthodontics', '10880 Wilshire Blvd #1400, Los Angeles, CA 90024', 'shipped', 317.00, now() - interval '1 day'),
  ('ord_1003', 'ORD-1003', 'cust_03', 'Metro Dental Care Center', '450 Lexington Ave, 11th Fl, New York, NY 10017', 'processing', 114.00, now() - interval '4 hours'),
  ('ord_1004', 'ORD-1004', 'cust_04', 'Riverside Pediatric Dentistry', '2201 S Interstate 35, Austin, TX 78741', 'pending', 421.45, now() - interval '1 hour'),
  ('ord_1005', 'ORD-1005', 'cust_01', 'Apex Family Dental Clinic (Dr. Elena Vance)', '742 Evergreen Terrace, Suite 300, Springfield, IL 62704', 'delivered', 192.75, now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Order Line Items
INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price)
VALUES 
  ('oi_1001_1', 'ord_1001', 'prod_01', 3, 28.50),
  ('oi_1001_2', 'ord_1001', 'prod_04', 4, 16.75),
  ('oi_1001_3', 'ord_1001', 'prod_05', 5, 14.99),
  ('oi_1002_1', 'ord_1002', 'prod_02', 2, 64.00),
  ('oi_1002_2', 'ord_1002', 'prod_03', 1, 189.00),
  ('oi_1003_1', 'ord_1003', 'prod_01', 4, 28.50),
  ('oi_1004_1', 'ord_1004', 'prod_03', 2, 189.00),
  ('oi_1004_2', 'ord_1004', 'prod_05', 3, 14.99),
  ('oi_1005_1', 'ord_1005', 'prod_04', 5, 16.75),
  ('oi_1005_2', 'ord_1005', 'prod_05', 7, 14.99)
ON CONFLICT (id) DO NOTHING;

-- 7. Chart of Accounts
INSERT INTO public.accounts (id, name, type, created_at)
VALUES 
  ('acc_cash',   'Cash / Bank',         'asset',     now()),
  ('acc_ar',     'Accounts Receivable',  'asset',     now()),
  ('acc_inv',    'Inventory',            'asset',     now()),
  ('acc_ap',     'Accounts Payable',     'liability', now()),
  ('acc_gst',    'GST Payable',          'liability', now()),
  ('acc_equity', 'Owner''s Equity',      'equity',    now()),
  ('acc_rev',    'Sales Revenue',        'revenue',   now()),
  ('acc_cogs',   'Cost of Goods Sold',   'expense',   now()),
  ('acc_rent',   'Rent Expense',         'expense',   now()),
  ('acc_wages',  'Wages Expense',        'expense',   now())
ON CONFLICT (id) DO NOTHING;

-- 8. General Journal Entries
INSERT INTO public.journal_entries (id, entry_date, source, source_reference, memo, created_at)
VALUES 
  ('je_ord_1001_rev',  CURRENT_DATE - 3, 'auto',   'order:ord_1001', 'Sale — ORD-1001', now() - interval '3 days'),
  ('je_ord_1001_cogs', CURRENT_DATE - 3, 'auto',   'order:ord_1001', 'COGS — ORD-1001', now() - interval '3 days'),
  ('je_ord_1005_rev',  CURRENT_DATE - 7, 'auto',   'order:ord_1005', 'Sale — ORD-1005', now() - interval '7 days'),
  ('je_ord_1005_cogs', CURRENT_DATE - 7, 'auto',   'order:ord_1005', 'COGS — ORD-1005', now() - interval '7 days'),
  ('je_rent_sep',      '2026-09-01',     'manual', NULL,             'September office rent', '2026-09-01 00:00:00Z'),
  ('je_wages_sep',     '2026-09-15',     'manual', NULL,             'September wages — warehouse', '2026-09-15 00:00:00Z'),
  ('je_equity_op',     '2026-09-01',     'manual', NULL,             'Owner capital contribution — initial setup', '2026-09-01 00:00:00Z'),
  ('je_adj_01_restock',CURRENT_DATE - 2, 'auto',   'stock_adjustment:adj_01', 'Restock — BIB-BLU-500 x140 (Batch A-1)', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Balanced Journal Lines
INSERT INTO public.journal_lines (id, journal_entry_id, account_id, debit, credit)
VALUES 
  -- Sale ORD-1001 ($247.50)
  ('jl_1001_1', 'je_ord_1001_rev', 'acc_cash', 247.50, 0.00),
  ('jl_1001_2', 'je_ord_1001_rev', 'acc_rev',  0.00, 222.75),
  ('jl_1001_3', 'je_ord_1001_rev', 'acc_gst',  0.00, 24.75),

  -- COGS ORD-1001 ($148.50)
  ('jl_1001_4', 'je_ord_1001_cogs', 'acc_cogs', 148.50, 0.00),
  ('jl_1001_5', 'je_ord_1001_cogs', 'acc_inv',  0.00, 148.50),

  -- Sale ORD-1005 ($192.75)
  ('jl_1005_1', 'je_ord_1005_rev', 'acc_cash', 192.75, 0.00),
  ('jl_1005_2', 'je_ord_1005_rev', 'acc_rev',  0.00, 173.48),
  ('jl_1005_3', 'je_ord_1005_rev', 'acc_gst',  0.00, 19.27),

  -- COGS ORD-1005 ($115.65)
  ('jl_1005_4', 'je_ord_1005_cogs', 'acc_cogs', 115.65, 0.00),
  ('jl_1005_5', 'je_ord_1005_cogs', 'acc_inv',  0.00, 115.65),

  -- September Rent ($1,800.00)
  ('jl_rent_1', 'je_rent_sep', 'acc_rent', 1800.00, 0.00),
  ('jl_rent_2', 'je_rent_sep', 'acc_cash', 0.00, 1800.00),

  -- September Wages ($3,200.00)
  ('jl_wages_1', 'je_wages_sep', 'acc_wages', 3200.00, 0.00),
  ('jl_wages_2', 'je_wages_sep', 'acc_cash',  0.00, 3200.00),

  -- Initial Capital ($50,000.00)
  ('jl_eq_1', 'je_equity_op', 'acc_cash',   50000.00, 0.00),
  ('jl_eq_2', 'je_equity_op', 'acc_equity', 0.00, 50000.00),

  -- Restock Adjustment ($2,394.00)
  ('jl_res_1', 'je_adj_01_restock', 'acc_inv', 2394.00, 0.00),
  ('jl_res_2', 'je_adj_01_restock', 'acc_ap',  0.00, 2394.00)
ON CONFLICT (id) DO NOTHING;
