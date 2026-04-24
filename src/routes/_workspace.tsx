import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Menu, X, Moon, Sun, Building2, ChevronDown, AlertTriangle } from "lucide-react";
import { useCloudAuth } from "@/lib/cloud-auth";
import { useTenant } from "@/lib/tenant";
import { useTheme } from "@/lib/theme";
import { CLOUD_NAV, moduleForPath } from "@/lib/module-routes";
import { toast } from "sonner";

export const Route = createFileRoute("/_workspace")({
  beforeLoad: () => {
    // Auth check is done in component to avoid SSR issues with Supabase localStorage
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { user, loading: authLoading, signOut } = useCloudAuth();
  const { tenant, modules, loading: tenantLoading, hasModule, clear } = useTenant();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !tenantLoading && !tenant) {
      navigate({ to: "/app" });
    }
  }, [authLoading, user, tenantLoading, tenant, navigate]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (authLoading || tenantLoading || !user || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const requiredModule = moduleForPath(location.pathname);
  const moduleBlocked = requiredModule !== null && !hasModule(requiredModule);

  const visibleNav = CLOUD_NAV.filter((n) => n.module === null || modules.has(n.module));

  const handleSignOut = async () => {
    clear();
    await signOut();
    toast.success("À bientôt !");
    navigate({ to: "/" });
  };

  const Sidebar = (
    <>
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">G</div>
          <div className="leading-tight min-w-0">
            <div className="font-display font-bold text-sidebar-foreground truncate">{tenant.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 capitalize">
              {tenant.activity_type.replace("_", " ")}
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/90 hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
        {visibleNav.length === 1 && (
          <p className="px-3 py-4 text-xs text-sidebar-foreground/60">
            Aucun module activé. Activez-les depuis les paramètres.
          </p>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        <Link to="/app" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors">
          <Building2 className="h-4 w-4" /> Changer d'entreprise
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors">
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
        <div className="text-center text-[10px] text-sidebar-foreground/50 pt-1">
          Propulsé par <span className="font-semibold text-primary">GESTEK</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        {Sidebar}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-sidebar">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 text-sidebar-foreground p-1">
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="font-display font-bold text-base md:text-lg truncate">{tenant.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                Plan {tenant.plan} · {tenant.currency}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                {(user.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold truncate max-w-[160px]">{user.email}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-up">
          {moduleBlocked ? <ModuleDisabled module={requiredModule!} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function ModuleDisabled({ module }: { module: string }) {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="font-display font-bold text-xl">Module désactivé</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Le module <strong className="capitalize">{module}</strong> n'est pas activé pour cette entreprise.
        Un administrateur peut l'activer depuis les paramètres.
      </p>
      <Link to="/workspace/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
