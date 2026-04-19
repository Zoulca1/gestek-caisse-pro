import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatTime } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingUp, Package, Wallet, Users, AlertTriangle, Clock } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  component: () => <ProtectedLayout><Dashboard /></ProtectedLayout>,
});

function KpiCard({ label, value, sub, icon: Icon, accent }: any) {
  const v = useCountUp(value);
  return (
    <div className="p-4 md:p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className={`h-9 w-9 rounded-lg grid place-items-center ${accent}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display font-bold text-2xl md:text-3xl tabular-nums">
        {typeof value === "number" ? v.toLocaleString("fr-FR") : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Dashboard() {
  const { products, sales, clients } = useData();

  const todayStr = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.date).toDateString() === todayStr);
  const totalToday = todaySales.reduce((s, x) => s + x.total, 0);
  const totalUnits = products.reduce((s, p) => s + Object.values(p.stockByStore).reduce((a, b) => a + b, 0), 0);
  const stockValue = products.reduce(
    (s, p) => s + Object.values(p.stockByStore).reduce((a, b) => a + b, 0) * p.buyPrice, 0
  );
  const alerts = products.filter((p) => {
    const total = Object.values(p.stockByStore).reduce((a, b) => a + b, 0);
    return total <= p.threshold;
  });
  const clientsWithCredit = clients.filter((c) => c.credit > 0);

  // 7 jours vs 7 d'avant
  const days7 = useMemo(() => {
    const arr: { day: string; cur: number; prev: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const p = new Date(); p.setDate(p.getDate() - i - 7);
      const dStr = d.toDateString(), pStr = p.toDateString();
      arr.push({
        day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
        cur: sales.filter((s) => new Date(s.date).toDateString() === dStr).reduce((a, b) => a + b.total, 0),
        prev: sales.filter((s) => new Date(s.date).toDateString() === pStr).reduce((a, b) => a + b.total, 0),
      });
    }
    return arr;
  }, [sales]);

  const top5 = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => s.items.forEach((it) => map.set(it.name, (map.get(it.name) || 0) + it.qty)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  }, [sales]);

  const lastSales = [...sales].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activité de l'épicerie.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Ventes du jour" value={totalToday} sub={`${todaySales.length} transaction${todaySales.length > 1 ? "s" : ""}`}
          icon={TrendingUp} accent="bg-primary/10 text-primary" />
        <KpiCard label="Unités en stock" value={totalUnits} sub={`${alerts.length} alerte${alerts.length > 1 ? "s" : ""}`}
          icon={Package} accent="bg-gold/20 text-gold-foreground" />
        <KpiCard label="Valeur du stock" value={stockValue} sub="Prix d'achat"
          icon={Wallet} accent="bg-primary/10 text-primary" />
        <KpiCard label="Clients" value={clients.length} sub={`${clientsWithCredit.length} avec crédit`}
          icon={Users} accent="bg-gold/20 text-gold-foreground" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 md:p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">Ventes 7 derniers jours</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Cette semaine</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/20" />Précédente</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={days7} barCategoryGap={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => (v / 1000) + "k"} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fcfa(v)}
                />
                <Bar dataKey="prev" fill="var(--color-primary)" fillOpacity={0.2} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cur" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Top 5 produits</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={top5} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={130} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" radius={[0, 4, 4, 0]} animationDuration={900}>
                  {top5.map((_, i) => <Cell key={i} fill="var(--color-gold)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-display font-bold">Alertes stock</h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {alerts.length === 0 && <div className="text-sm text-muted-foreground">Aucune alerte</div>}
            {alerts.map((p) => {
              const total = Object.values(p.stockByStore).reduce((a, b) => a + b, 0);
              const isOut = total === 0;
              return (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{p.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Seuil : {p.threshold}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isOut ? "bg-destructive/10 text-destructive" : "bg-warning/20 text-warning-foreground"}`}>
                    {isOut ? "Rupture" : `${total} restant`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold">Dernières ventes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="py-2">N°</th><th>Client</th><th className="text-right">Total</th><th className="text-right">Bénéf.</th><th className="text-right">Heure</th>
                </tr>
              </thead>
              <tbody>
                {lastSales.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{s.number}</td>
                    <td className="truncate max-w-[120px]">{s.clientName}</td>
                    <td className="text-right tabular-nums">{fcfa(s.total)}</td>
                    <td className="text-right tabular-nums text-primary font-semibold">{fcfa(s.profit)}</td>
                    <td className="text-right text-xs text-muted-foreground">{formatTime(s.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
