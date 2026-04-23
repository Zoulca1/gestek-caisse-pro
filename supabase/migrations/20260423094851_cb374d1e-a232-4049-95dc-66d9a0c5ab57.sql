
-- ============== ENUMS ==============
CREATE TYPE public.activity_type AS ENUM (
  'pharmacie', 'restaurant', 'boutique_generale', 'quincaillerie',
  'cosmetique', 'alimentaire', 'electronique', 'mode', 'autre'
);

CREATE TYPE public.app_role AS ENUM (
  'owner', 'admin', 'vendeur', 'stock', 'comptable', 'viewer'
);

CREATE TYPE public.module_key AS ENUM (
  'ventes', 'stock', 'clients', 'fournisseurs', 'devis',
  'comptabilite', 'employes', 'conges', 'transferts', 'rapports'
);

CREATE TYPE public.subscription_plan AS ENUM ('trial', 'starter', 'business', 'pro');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============== TENANTS ==============
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  activity_type public.activity_type NOT NULL DEFAULT 'boutique_generale',
  currency TEXT NOT NULL DEFAULT 'XOF',
  country TEXT DEFAULT 'CI',
  plan public.subscription_plan NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============== TENANT_MEMBERS ==============
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

-- ============== USER_ROLES ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user_tenant ON public.user_roles(user_id, tenant_id);

-- ============== TENANT_MODULES ==============
CREATE TABLE public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module public.module_key NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, module)
);

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

-- ============== TENANT_INVITATIONS ==============
CREATE TABLE public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendeur',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invitations_email ON public.tenant_invitations(email);
CREATE INDEX idx_invitations_token ON public.tenant_invitations(token);

-- ============== SECURITY DEFINER FUNCTIONS (anti-recursion) ==============
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('owner', 'admin')
  );
$$;

-- ============== RLS POLICIES ==============

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- tenants
CREATE POLICY "Members can view their tenants" ON public.tenants
  FOR SELECT USING (public.is_tenant_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can update their tenant" ON public.tenants
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), id));
CREATE POLICY "Owners can delete their tenant" ON public.tenants
  FOR DELETE USING (public.has_tenant_role(auth.uid(), id, 'owner'));

-- tenant_members
CREATE POLICY "Members can view tenant members" ON public.tenant_members
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins can add members" ON public.tenant_members
  FOR INSERT WITH CHECK (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR auth.uid() = user_id  -- self-add via accept invitation
  );
CREATE POLICY "Admins can remove members" ON public.tenant_members
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- user_roles
CREATE POLICY "Members can view roles" ON public.user_roles
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins can assign roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (auth.uid() = user_id AND role = 'owner') -- creator becomes owner
  );
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- tenant_modules
CREATE POLICY "Members can view modules" ON public.tenant_modules
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins manage modules insert" ON public.tenant_modules
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins manage modules update" ON public.tenant_modules
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins manage modules delete" ON public.tenant_modules
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- tenant_invitations
CREATE POLICY "Admins can view invitations" ON public.tenant_invitations
  FOR SELECT USING (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins can create invitations" ON public.tenant_invitations
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) AND auth.uid() = invited_by);
CREATE POLICY "Admins can delete invitations" ON public.tenant_invitations
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- ============== TRIGGERS ==============

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
