
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  _name text,
  _slug text,
  _activity activity_type,
  _country text,
  _currency text,
  _modules module_key[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _tenant_id uuid;
  _m module_key;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.tenants (name, slug, activity_type, country, currency, owner_id, onboarded)
  VALUES (_name, _slug, _activity, _country, _currency, _user_id, true)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES (_user_id, _tenant_id, 'owner');
  INSERT INTO public.tenant_members (user_id, tenant_id) VALUES (_user_id, _tenant_id);

  IF _modules IS NOT NULL THEN
    FOREACH _m IN ARRAY _modules LOOP
      INSERT INTO public.tenant_modules (tenant_id, module, enabled) VALUES (_tenant_id, _m, true);
    END LOOP;
  END IF;

  RETURN _tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_with_owner(text, text, activity_type, text, text, module_key[]) TO authenticated;
