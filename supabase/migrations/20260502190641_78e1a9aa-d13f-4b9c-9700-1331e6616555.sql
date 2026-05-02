-- Restrict tenant write policies to authenticated users (instead of public)
-- This prevents auth.uid()=NULL silently failing the WITH CHECK on missing JWT

DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;
CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
CREATE POLICY "Admins can update their tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), id));

DROP POLICY IF EXISTS "Owners can delete their tenant" ON public.tenants;
CREATE POLICY "Owners can delete their tenant"
  ON public.tenants FOR DELETE
  TO authenticated
  USING (has_tenant_role(auth.uid(), id, 'owner'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR ((auth.uid() = user_id) AND (role = 'owner'::app_role)));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- tenant_members
DROP POLICY IF EXISTS "Admins can add members" ON public.tenant_members;
CREATE POLICY "Admins can add members"
  ON public.tenant_members FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR (auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can remove members" ON public.tenant_members;
CREATE POLICY "Admins can remove members"
  ON public.tenant_members FOR DELETE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- tenant_modules
DROP POLICY IF EXISTS "Admins manage modules insert" ON public.tenant_modules;
CREATE POLICY "Admins manage modules insert"
  ON public.tenant_modules FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins manage modules update" ON public.tenant_modules;
CREATE POLICY "Admins manage modules update"
  ON public.tenant_modules FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins manage modules delete" ON public.tenant_modules;
CREATE POLICY "Admins manage modules delete"
  ON public.tenant_modules FOR DELETE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));