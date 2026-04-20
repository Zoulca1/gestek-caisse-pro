import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Truck, ArrowRightLeft, Users, Building2,
  BarChart3, Settings, ChevronDown, LogOut, Moon, Sun, Bell, Menu, X, Boxes, UserCog,
  Calculator, FileText, Lock, Printer, CheckCircle2, Users2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/store";
import { fcfa } from "@/lib/format";
import { toast } from "sonner";
import type { DailyClosing } from "@/lib/types";

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
  { to: "/devis", label: "Devis", icon: FileText, roles: ["admin", "vendeur"] },
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
  { to: "/employes", label: "Employés", icon: Users2, roles: ["admin"] },
  { to: "/rapports", label: "Rapports & Stats", icon: BarChart3 },
  { to: "/comptabilite", label: "Comptabilité", icon: Calculator },
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
  const [closingOpen, setClosingOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ruptures = products.filter((p) =>
    Object.values(p.stockByStore).reduce((a, b) => a + b, 0) === 0
  ).length;

  const visibleNav = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));
  const isActive = (to: string) => location.pathname === to;
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const canClose = user?.role === "admin";

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
                      <Link key={c.to} to={c.to}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive(c.to) ? "bg-gold text-gold-foreground font-semibold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                        }`}>
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
          <Link key={item.to} to={item.to!}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.to!) ? "bg-gold text-gold-foreground" : "text-sidebar-foreground/90 hover:bg-sidebar-accent"
            }`}>
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
      <button onClick={() => { logout(); navigate({ to: "/" }); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors">
        <LogOut className="h-4 w-4" /> Déconnexion
      </button>
      <div className="mt-2 text-center text-[10px] text-sidebar-foreground/50">Propulsé par <span className="font-semibold text-gold">GESTEK</span></div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        {SidebarHeader}{SidebarContent}{SidebarFooter}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-sidebar animate-slide-in">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 text-sidebar-foreground p-1"><X className="h-5 w-5" /></button>
            {SidebarHeader}{SidebarContent}{SidebarFooter}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
            {canClose && (
              <button onClick={() => setClosingOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10">
                <Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Clôturer la journée</span>
              </button>
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

        <button onClick={() => setMobileOpen(true)}
          className="md:hidden fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:bg-primary-glow transition-colors"
          aria-label="Menu">
          <Menu className="h-6 w-6" />
        </button>

        {closingOpen && <ClosingModal onClose={() => setClosingOpen(false)} cashier={user?.name || "—"} />}
      </div>
    </div>
  );
}

function ClosingModal({ onClose, cashier }: { onClose: () => void; cashier: string }) {
  const { sales, closings, setClosings, company } = useData();
  const [cashCounted, setCashCounted] = useState("");
  const [note, setNote] = useState("");
  const [printing, setPrinting] = useState<DailyClosing | null>(null);

  const todayStr = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.date).toDateString() === todayStr);

  const stats = useMemo(() => {
    const byPayment: Record<string, number> = {};
    todaySales.forEach((s) => { byPayment[s.payment] = (byPayment[s.payment] || 0) + s.total; });
    const total = todaySales.reduce((a, b) => a + b.total, 0);
    const profit = todaySales.reduce((a, b) => a + b.profit, 0);
    const units = todaySales.reduce((a, b) => a + b.items.reduce((x, y) => x + y.qty, 0), 0);
    const clients = new Set(todaySales.filter((s) => s.clientId).map((s) => s.clientId)).size;
    return { byPayment, total, profit, units, clients };
  }, [todaySales]);

  const cashSystem = stats.byPayment["Espèces"] || 0;
  const counted = parseFloat(cashCounted) || 0;
  const diff = counted - cashSystem;

  const buildClosing = (): DailyClosing => ({
    id: "cl-" + Date.now(),
    number: "CL-" + String(closings.length + 1).padStart(4, "0"),
    date: new Date().toISOString(),
    cashier,
    salesCount: todaySales.length,
    byPayment: stats.byPayment,
    total: stats.total,
    profit: stats.profit,
    unitsSold: stats.units,
    clientsServed: stats.clients,
    cashCounted: counted,
    cashSystem,
    diff,
    note,
  });

  const validate = () => {
    const cl = buildClosing();
    setClosings([cl, ...closings]);
    toast.success(`Clôture ${cl.number} validée`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4 overflow-y-auto">
        <div className="bg-card rounded-xl w-full max-w-2xl p-5 my-8 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" /> Clôture de caisse · {new Date().toLocaleDateString("fr-FR")}
            </h2>
            <button onClick={onClose}><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <Stat label="Nb ventes" value={String(todaySales.length)} />
              <Stat label="Articles vendus" value={String(stats.units)} />
              <Stat label="Clients servis" value={String(stats.clients)} />
            </div>
            <div className="rounded-lg border border-border divide-y divide-border">
              {(["Espèces", "Orange Money", "Wave", "MTN MoMo", "Crédit client"] as const).map((m) => (
                <div key={m} className="flex justify-between px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">{m}</span>
                  <span className="font-semibold tabular-nums">{fcfa(stats.byPayment[m] || 0)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-gold/10 border border-gold/40 p-4 text-center">
              <div className="text-xs uppercase font-semibold text-muted-foreground">Total général</div>
              <div className="font-display font-bold text-3xl text-gold tabular-nums">{fcfa(stats.total)}</div>
              <div className="text-xs text-muted-foreground mt-1">Bénéfice brut : <span className="font-semibold text-primary">{fcfa(stats.profit)}</span></div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Espèces comptées physiquement</span>
                <input type="number" value={cashCounted} onChange={(e) => setCashCounted(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="0" />
              </label>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Écart</span>
                <div className={`mt-1 px-3 py-2 rounded-lg border border-input text-sm font-bold tabular-nums ${
                  diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-success" : "text-destructive"
                }`}>
                  {diff > 0 ? "+" : ""}{fcfa(diff)} <span className="text-xs font-normal text-muted-foreground">(système : {fcfa(cashSystem)})</span>
                </div>
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Observation</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <button onClick={() => setPrinting(buildClosing())} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-semibold">
              <Printer className="h-4 w-4" /> Imprimer le rapport
            </button>
            <button onClick={validate} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Valider la clôture
            </button>
          </div>
        </div>
      </div>
      {printing && <ClosingPrint cl={printing} company={company} onClose={() => setPrinting(null)} />}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</div>
      <div className="font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ClosingPrint({ cl, company, onClose }: { cl: DailyClosing; company: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 grid place-items-center p-4 overflow-y-auto print:bg-white print:p-0 print:block">
      <div className="bg-white text-black rounded-xl w-full max-w-md p-6 my-8 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 rounded bg-[#1B5E20] text-white grid place-items-center font-bold">G</div>
          <div className="text-right text-xs">
            <div className="font-bold">{company.name}</div>
            <div className="text-gray-600">{company.address}</div>
          </div>
        </div>
        <h1 className="text-center text-xl font-bold border-y-2 border-[#1B5E20] py-2 mb-3">RAPPORT DE CLÔTURE</h1>
        <div className="text-center text-sm text-gray-600 mb-3">
          {new Date(cl.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          <div className="text-xs">N° {cl.number}</div>
        </div>

        <table className="w-full text-sm mb-3">
          <tbody>
            {Object.entries(cl.byPayment).map(([k, v]) => (
              <tr key={k} className="border-b"><td className="py-1.5">{k}</td><td className="text-right tabular-nums">{fcfa(v)}</td></tr>
            ))}
            <tr className="bg-yellow-50 border-2 border-[#F9A825]">
              <td className="py-2 px-2 font-bold">TOTAL</td>
              <td className="py-2 px-2 text-right font-bold text-lg tabular-nums">{fcfa(cl.total)}</td>
            </tr>
            <tr><td className="py-1.5 text-gray-600">Bénéfice brut</td><td className="text-right tabular-nums">{fcfa(cl.profit)}</td></tr>
            <tr><td className="py-1.5 text-gray-600">Articles vendus</td><td className="text-right">{cl.unitsSold}</td></tr>
            <tr><td className="py-1.5 text-gray-600">Clients servis</td><td className="text-right">{cl.clientsServed}</td></tr>
            <tr><td className="py-1.5 text-gray-600">Espèces comptées</td><td className="text-right tabular-nums">{fcfa(cl.cashCounted)}</td></tr>
            <tr><td className="py-1.5 text-gray-600">Écart</td><td className={`text-right tabular-nums ${cl.diff < 0 ? "text-red-600" : "text-green-700"}`}>{cl.diff > 0 ? "+" : ""}{fcfa(cl.diff)}</td></tr>
          </tbody>
        </table>

        {cl.note && <div className="text-xs text-gray-700 italic mb-3">"{cl.note}"</div>}

        <div className="text-sm mt-8 mb-3">
          <div>Caissier : <span className="font-bold">{cl.cashier}</span></div>
          <div className="border-t border-gray-400 mt-6 pt-1 text-xs text-center w-48 mx-auto">Signature</div>
        </div>

        <div className="text-center text-[10px] text-gray-500 border-t border-gray-200 pt-2 mt-4">
          <div className="font-bold text-[#1B5E20]">GESTEK — Gérez mieux. Vendez plus.</div>
        </div>

        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">Fermer</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-[#1B5E20] text-white text-sm font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
