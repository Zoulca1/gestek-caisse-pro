import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudAuth } from "@/lib/cloud-auth";
import type { Database } from "@/integrations/supabase/types";

export type ModuleKey = Database["public"]["Enums"]["module_key"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export interface TenantInfo {
  id: string;
  name: string;
  activity_type: Database["public"]["Enums"]["activity_type"];
  currency: string;
  country: string | null;
  plan: Database["public"]["Enums"]["subscription_plan"];
  trial_ends_at: string | null;
  onboarded: boolean;
}

interface TenantContextValue {
  tenant: TenantInfo | null;
  modules: Set<ModuleKey>;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  hasModule: (m: ModuleKey) => boolean;
  setActiveTenant: (tenantId: string) => void;
  refresh: () => Promise<void>;
  clear: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const STORAGE_KEY = "gestek.activeTenantId";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useCloudAuth();
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [modules, setModules] = useState<Set<ModuleKey>>(new Set());
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(false);

  const setActiveTenant = useCallback((tenantId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, tenantId);
    }
    setActiveTenantIdState(tenantId);
  }, []);

  const clear = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setActiveTenantIdState(null);
    setTenant(null);
    setModules(new Set());
    setRole(null);
  }, []);

  const load = useCallback(async () => {
    if (!user || !activeTenantId) {
      setTenant(null);
      setModules(new Set());
      setRole(null);
      return;
    }
    setLoading(true);
    try {
      const [{ data: tenantData }, { data: modulesData }, { data: roleData }] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", activeTenantId).maybeSingle(),
        supabase.from("tenant_modules").select("module, enabled").eq("tenant_id", activeTenantId),
        supabase.from("user_roles").select("role").eq("tenant_id", activeTenantId).eq("user_id", user.id).maybeSingle(),
      ]);

      if (tenantData) setTenant(tenantData as TenantInfo);
      else setTenant(null);

      const enabled = new Set<ModuleKey>();
      (modulesData || []).forEach((m) => {
        if (m.enabled) enabled.add(m.module as ModuleKey);
      });
      setModules(enabled);
      setRole((roleData?.role as AppRole) ?? null);
    } finally {
      setLoading(false);
    }
  }, [user, activeTenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset on logout
  useEffect(() => {
    if (!user) clear();
  }, [user, clear]);

  const isAdmin = role === "owner" || role === "admin";
  const hasModule = useCallback((m: ModuleKey) => modules.has(m), [modules]);

  return (
    <TenantContext.Provider
      value={{ tenant, modules, role, loading, isAdmin, hasModule, setActiveTenant, refresh: load, clear }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
