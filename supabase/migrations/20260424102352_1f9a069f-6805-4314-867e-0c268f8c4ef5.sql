-- ============================================
-- VAGUE 3 : Tables métier multi-tenant
-- ============================================

-- Helper trigger function (réutilise set_updated_at existant)

-- 1. PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pièce',
  cost_price NUMERIC(14,2) DEFAULT 0,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  stock_alert NUMERIC(14,3) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view products" ON public.products FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_tenant ON public.customers(tenant_id);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view customers" ON public.customers FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert customers" ON public.customers FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update customers" ON public.customers FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_suppliers_tenant ON public.suppliers(tenant_id);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view suppliers" ON public.suppliers FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update suppliers" ON public.suppliers FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete suppliers" ON public.suppliers FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. SALES
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  seller_id UUID,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'especes',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_sold_at ON public.sales(tenant_id, sold_at DESC);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view sales" ON public.sales FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Members insert sales" ON public.sales FOR INSERT WITH CHECK (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins update sales" ON public.sales FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete sales" ON public.sales FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. SALE_ITEMS
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_tenant ON public.sale_items(tenant_id);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view sale items" ON public.sale_items FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Members insert sale items" ON public.sale_items FOR INSERT WITH CHECK (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins update sale items" ON public.sale_items FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete sale items" ON public.sale_items FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 6. QUOTES
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_tenant ON public.quotes(tenant_id);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view quotes" ON public.quotes FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert quotes" ON public.quotes FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update quotes" ON public.quotes FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete quotes" ON public.quotes FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. EMPLOYEES
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  salary NUMERIC(14,2) DEFAULT 0,
  hired_at DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view employees" ON public.employees FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert employees" ON public.employees FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update employees" ON public.employees FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete employees" ON public.employees FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. ACCOUNTING_ENTRIES
CREATE TABLE public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'expense',
  category TEXT,
  label TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_acct_tenant ON public.accounting_entries(tenant_id);
CREATE INDEX idx_acct_date ON public.accounting_entries(tenant_id, entry_date DESC);
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view accounting" ON public.accounting_entries FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins insert accounting" ON public.accounting_entries FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins update accounting" ON public.accounting_entries FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins delete accounting" ON public.accounting_entries FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_acct_updated_at BEFORE UPDATE ON public.accounting_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();