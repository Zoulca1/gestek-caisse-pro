import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa } from "@/lib/format";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Download, ArrowUp, ArrowDown, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rapports")({
  component: () => <ProtectedLayout><RapportsPage /></ProtectedLayout>,
});

function RapportsPage() {
  const { sales, clients } = useData();

  const now = new Date();
  const thisMonth = sales.filter((s) => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear());
  const ca = thisMonth.reduce((s, x) => s + x.total, 0);
  const profit = thisMonth.reduce((s, x) => s + x.profit, 0);
  const profitPct = ca ? (profit / ca) * 100 : 0;

  const lastMonthIdx = (now.getMonth() + 11) % 12;
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonth = sales.filter((s) => new Date(s.date).getMonth() === lastMonthIdx && new Date(s.date).getFullYear() === lastMonthYear);

  const top10 = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => s.items.forEach((it) => map.set(it.name, (map.get(it.name) || 0) + it.qty)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, qty]) => ({ name, qty }));
  }, [sales]);

  const paymentDist = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => map.set(s.payment, (map.get(s.payment) || 0) + s.total));
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return [...map.entries()].map(([name, v]) => ({ name, pct: (v / total) * 100, value: v }));
  }, [sales]);

  const compare = [
    { label: "Chiffre d'affaires", cur: ca, prev: lastMonth.reduce((s, x) => s + x.total, 0) },
    { label: "Bénéfice", cur: profit, prev: lastMonth.reduce((s, x) => s + x.profit, 0) },
    { label: "Transactions", cur: thisMonth.length, prev: lastMonth.length },
    { label: "Panier moyen", cur: thisMonth.length ? ca / thisMonth.length : 0, prev: lastMonth.length ? lastMonth.reduce((s, x) => s + x.total, 0) / lastMonth.length : 0 },
    { label: "Articles vendus", cur: thisMonth.reduce((s, x) => s + x.items.reduce((a, b) => a + b.qty, 0), 0), prev: lastMonth.reduce((s, x) => s + x.items.reduce((a, b) => a + b.qty, 0), 0) },
    { label: "Crédit accordé", cur: thisMonth.filter((s) => s.payment === "Crédit client").reduce((s, x) => s + x.total, 0), prev: lastMonth.filter((s) => s.payment === "Crédit client").reduce((s, x) => s + x.total, 0) },
  ];

  const debtors = clients.filter((c) => c.credit > 0);

  const exportCSV = () => {
    const header = "N°,Date,Client,Total,Bénéfice,Paiement\n";
    const rows = sales.map((s) => `${s.number},${new Date(s.date).toISOString()},${s.clientName},${s.total},${s.profit},${s.payment}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ventes-koffi.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const sendReminder = (c: typeof clients[0]) => {
    const msg = `Bonjour ${c.name}, rappel amical : crédit de ${fcfa(c.credit)} chez Épicerie KOFFI. Merci !`;
    window.open(`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Rapports & statistiques</h1>
          <p className="text-sm text-muted-foreground">Analyse de performance commerciale.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-semibold">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">CA ce mois</div>
          <div className="mt-2 font-display font-bold text-3xl tabular-nums">{fcfa(ca)}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Bénéfice brut</div>
          <div className="mt-2 font-display font-bold text-3xl tabular-nums text-primary">{fcfa(profit)}</div>
          <div className="text-xs text-muted-foreground mt-1">Marge : {profitPct.toFixed(1)}%</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Transactions</div>
          <div className="mt-2 font-display font-bold text-3xl tabular-nums">{thisMonth.length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Top 10 produits vendus</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={140} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" radius={[0, 4, 4, 0]} animationDuration={1000}>
                  {top10.map((_, i) => <Cell key={i} fill={i < 3 ? "var(--color-gold)" : "var(--color-primary)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Modes de paiement</h2>
          <div className="space-y-3">
            {paymentDist.map((p, i) => {
              const colors = ["var(--color-primary)", "var(--color-gold)", "#25D366", "#FF6B35", "var(--color-destructive)"];
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.pct.toFixed(0)}% · {fcfa(p.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full transition-all" style={{ width: p.pct + "%", backgroundColor: colors[i % colors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold mb-3">Comparaison mois sur mois</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="text-left"><th className="px-3 py-2">Indicateur</th><th className="px-3 py-2 text-right">Ce mois</th><th className="px-3 py-2 text-right">Mois passé</th><th className="px-3 py-2 text-right">Évolution</th></tr>
            </thead>
            <tbody>
              {compare.map((c) => {
                const diff = c.prev ? ((c.cur - c.prev) / c.prev) * 100 : 0;
                const up = diff >= 0;
                const Icon = up ? ArrowUp : ArrowDown;
                return (
                  <tr key={c.label} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{c.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.label.includes("Trans") || c.label.includes("Articles") ? c.cur.toLocaleString("fr-FR") : fcfa(c.cur)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.label.includes("Trans") || c.label.includes("Articles") ? c.prev.toLocaleString("fr-FR") : fcfa(c.prev)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${up ? "text-success" : "text-destructive"}`}>
                      <span className="inline-flex items-center gap-1"><Icon className="h-3 w-3" /> {Math.abs(diff).toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold mb-3">Clients avec crédit en cours</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="text-left"><th className="px-3 py-2">Client</th><th className="px-3 py-2">Téléphone</th><th className="px-3 py-2 text-right">Crédit</th><th className="px-3 py-2 text-right">Action</th></tr>
            </thead>
            <tbody>
              {debtors.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.phone}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-destructive font-semibold">{fcfa(c.credit)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => sendReminder(c)} className="px-2 py-1 rounded text-white text-xs flex items-center gap-1 ml-auto" style={{ backgroundColor: "#25D366" }}>
                      <MessageCircle className="h-3 w-3" /> Rappel
                    </button>
                  </td>
                </tr>
              ))}
              {debtors.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun crédit en cours 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
