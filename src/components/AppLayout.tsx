import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Truck, ArrowRightLeft, Users, Building2,
  BarChart3, Settings, ChevronDown, LogOut, Moon, Sun, Bell, Menu, X, Boxes, UserCog,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/store";

interface NavItem {
  to?: string;
  label: string;
  icon: any;
  children?: { to: string; label: string; icon: any }[];
  roles?: ("admin" | "vendeur" | "stock")[];
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/vente", label: "Nouvelle vente", icon: ShoppingCart, roles: ["admin", "vendeur"] },
  {
    label: "Gestion du stock", icon: Boxes, roles: ["admin", "stock"],
    children: [
      { to: "/produits", label: "Produits & catalogue", icon: Package },
      { to: "/entrees", label: "Entrées de stock", icon: Truck },
      { to: "/transferts", label: "Transferts entre magasins", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Clients & Partenaires", icon: UserCog,
    children: [
      { to: "/clients", label: "Clients", icon: Users },
      { to: "/fournisseurs", label: "Fournisseurs", icon: Building2 },
    ],
  },
  { to: "/rapports", label: "Rapports & Stats", icon: BarChart3 },
  { to: "/parametres", label: "Paramètres", icon: Settings, roles: ["admin"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { products } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState<Record<string, boolean>>({ "Gestion du stock": true, "Clients & Partenaires": true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // total ruptures
  const ruptures = products.filter((p) =>
    Object.values(p.stockByStore).reduce((a, b) => a + b, 0) === 0
  ).length;

  const visibleNav = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));

  const isActive = (to: string) => location.pathname === to;

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const SidebarContent = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {visibleNav.map((item) => {
        if (item.children) {
          const isOpen = open[item.label];
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [item.label]: !o[item.label] }))}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sidebar-foreground/90 hover:bg-sidebar-accent transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2.5"><Icon className="h-4 w-4" /> {item.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.children.map((c) => {
                    const CIcon = c.icon;
                    return (
                      <Link
                        key={c.to}
                        to={c.to}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive(c.to)
                            ? "bg-gold text-gold-foreground font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                        }`}
                      >
                        <CIcon className="h-3.5 w-3.5" />{c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to!}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.to!)
                ? "bg-gold text-gold-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarHeader = (
    <div className="px-5 py-5 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-gold text-gold-foreground grid place-items-center font-display font-bold">K</div>
        <div className="leading-tight">
          <div className="font-display font-bold text-sidebar-foreground">KOFFI</div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Épicerie Moderne</div>
        </div>
      </div>
    </div>
  );

  const SidebarFooter = (
    <div className="px-3 py-3 border-t border-sidebar-border">
      <button
        onClick={() => { logout(); navigate({ to: "/" }); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
      >
        <LogOut className="h-4 w-4" /> Déconnexion
      </button>
      <div className="mt-2 text-center text-[10px] text-sidebar-foreground/50">Propulsé par <span className="font-semibold text-gold">GESTEK</span></div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        {SidebarHeader}
        {SidebarContent}
        {SidebarFooter}
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-sidebar animate-slide-in">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 text-sidebar-foreground p-1"><X className="h-5 w-5" /></button>
            {SidebarHeader}
            {SidebarContent}
            {SidebarFooter}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
            <div className="min-w-0">
              <div className="font-display font-bold text-base md:text-lg truncate">Épicerie Moderne KOFFI</div>
              <div className="text-xs text-muted-foreground truncate">Abidjan, Côte d'Ivoire</div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {ruptures > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold animate-blink">
                <Bell className="h-3.5 w-3.5" /> {ruptures} rupture{ruptures > 1 ? "s" : ""}
              </div>
            )}
            <div className="hidden md:block text-sm text-muted-foreground tabular-nums">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {now.toLocaleTimeString("fr-FR")}
            </div>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Mode nuit">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                {user?.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold">{user?.name}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-up">{children}</main>

        <footer className="text-center py-3 text-[11px] text-muted-foreground border-t border-border">
          © {new Date().getFullYear()} Épicerie Moderne KOFFI · Propulsé par <span className="font-semibold text-primary">GESTEK</span>
        </footer>

        {/* FAB mobile */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:bg-primary-glow transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
