import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { CLOUD_NAV } from "@/lib/module-routes";

export const Route = createFileRoute("/workspace/dashboard")({
  component: CloudDashboard,
});

interface Stats {
  productsCount: number;
  customersCount: number;
  salesCount: number;
  salesTotal: number;
  lowStock: number;
}

function CloudDashboard() {
  const { tenant, modules, hasModule } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      setLoading(true);
      const tid = tenant.id;
      const [products, customers, sales, lowStock] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
        supabase.from("sales").select("total").eq("tenant_id", tid),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tid).lt("stock_quantity", 5),
      ]);
      const salesTotal = (sales.data || []).reduce((acc, s) => acc + Number(s.total || 0), 0);
      setStats({
        productsCount: products.count ?? 0,
        customersCount: customers.count ?? 0,
        salesCount: (sales.data || []).length,
        salesTotal,
        lowStock: lowStock.count ?? 0,
      });
      setLoading(false);
    })();
  }, [tenant]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: tenant?.currency || "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue dans votre espace <strong>{tenant?.name}</strong>.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Produits" value={stats.productsCount.toString()} />
        <StatCard icon={Users} label="Clients" value={stats.customersCount.toString()} />
        <StatCard icon={ShoppingCart} label="Ventes" value={stats.salesCount.toString()} />
        <StatCard icon={TrendingUp} label="Chiffre d'affaires" value={fmt(stats.salesTotal)} />
      </div>

      {stats.lowStock > 0 && hasModule("stock") && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm">
            <strong>{stats.lowStock}</strong> produit{stats.lowStock > 1 ? "s" : ""} en rupture ou stock faible.
          </div>
          <Link to="/workspace/produits" className="text-xs font-semibold text-amber-700 hover:underline">
            Voir →
          </Link>
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-lg mb-3">Vos modules actifs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CLOUD_NAV.filter((n) => n.module && modules.has(n.module)).map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className="rounded-xl border border-border bg-card p-4 hover:border-primary transition flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{n.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display font-bold text-2xl tabular-nums">{value}</div>
    </div>
  );
}
