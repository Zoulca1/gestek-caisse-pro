import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";

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

interface SaleRow {
  id: string;
  total: number;
  sold_at: string;
}

interface SaleItemRow {
  product_name: string;
  quantity: number;
  line_total: number;
}

function CloudDashboard() {
  const { tenant, hasModule } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales30, setSales30] = useState<SaleRow[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; qty: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      setLoading(true);
      const tid = tenant.id;
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

      const [products, customers, salesAll, lowStock, sales30d, items30d] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
        supabase.from("sales").select("total").eq("tenant_id", tid),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tid).lt("stock_quantity", 5),
        supabase.from("sales").select("id,total,sold_at").eq("tenant_id", tid).gte("sold_at", since30).order("sold_at", { ascending: true }),
        supabase.from("sale_items").select("product_name,quantity,line_total,sale_id,sales!inner(sold_at,tenant_id)").eq("tenant_id", tid).gte("sales.sold_at", since30),
      ]);
      const salesTotal = (salesAll.data || []).reduce((acc, s) => acc + Number(s.total || 0), 0);
      setStats({
        productsCount: products.count ?? 0,
        customersCount: customers.count ?? 0,
        salesCount: (salesAll.data || []).length,
        salesTotal,
        lowStock: lowStock.count ?? 0,
      });
      setSales30((sales30d.data || []) as SaleRow[]);

      const map = new Map<string, number>();
      (items30d.data || []).forEach((row: any) => {
        const name = row.product_name as string;
        map.set(name, (map.get(name) || 0) + Number(row.quantity || 0));
      });
      const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
      setTopItems(top);

      setLoading(false);
    })();
  }, [tenant]);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: tenant?.currency || "XOF", maximumFractionDigits: 0 }).format(n);

  // Chart: revenue per day, last 30 days
  const dailyRevenue = useMemo(() => {
    const days: { date: string; label: string; revenue: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        revenue: 0,
        count: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    sales30.forEach((s) => {
      const k = new Date(s.sold_at).toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) {
        days[i].revenue += Number(s.total || 0);
        days[i].count += 1;
      }
    });
    return days;
  }, [sales30]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Evolution charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 md:p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-bold">Évolution du chiffre d'affaires</h2>
              <p className="text-xs text-muted-foreground">30 derniers jours</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              {fmt(dailyRevenue.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} interval={4} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n: any) => n === "revenue" ? [fmt(Number(v)), "CA"] : [v, n]}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-1">Nombre de ventes / jour</h2>
          <p className="text-xs text-muted-foreground mb-3">30 derniers jours</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} interval={6} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-1">Top 5 produits vendus</h2>
          <p className="text-xs text-muted-foreground mb-3">30 derniers jours</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={140} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                  {topItems.map((_, i) => <Cell key={i} fill="var(--color-primary)" fillOpacity={1 - i * 0.15} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
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
