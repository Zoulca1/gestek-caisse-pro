
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country_full text,
  ADD COLUMN IF NOT EXISTS phone_company text,
  ADD COLUMN IF NOT EXISTS email_company text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS cc_number text,
  ADD COLUMN IF NOT EXISTS bank_info text,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS invoice_footer text,
  ADD COLUMN IF NOT EXISTS invoice_prefix text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read company-assets" ON storage.objects;
CREATE POLICY "Public read company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "Tenant admins upload company-assets" ON storage.objects;
CREATE POLICY "Tenant admins upload company-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Tenant admins update company-assets" ON storage.objects;
CREATE POLICY "Tenant admins update company-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Tenant admins delete company-assets" ON storage.objects;
CREATE POLICY "Tenant admins delete company-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
