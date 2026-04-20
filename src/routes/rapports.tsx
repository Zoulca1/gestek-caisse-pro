import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate } from "@/lib/format";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, Legend,
} from "recharts";
import { Download, ArrowUp, ArrowDown, MessageCircle, Target } from "lucide-react";
import { toast } from "sonner";
import type { DailyClosing } from "@/lib/types";

export const Route = createFileRoute("/rapports")({
  component: () => <ProtectedLayout><RapportsPage /></ProtectedLayout>,
});

function RapportsPage() {
  const [tab, setTab] = useState<"general" | "finance" | "clotures">("general");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Rapports & statistiques</h1>
        <p className="text-sm text-muted-foreground">Analyse de performance commerciale.</p>
      </div>
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          ["general", "Général"],
          ["finance", "Finance"],
          ["clotures", "Clôtures journalières"],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "general" && <GeneralTab />}
      {tab === "finance" && <FinanceTab />}
      {tab === "clotures" && <CloturesTab />}
    </div>
  );
}

function GeneralTab() {
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
      <div className="flex justify-end">
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

function FinanceTab() {
  const { sales, expenses, company } = useData();
  const now = new Date();
  const monthIdx = now.getMonth(), yearIdx = now.getFullYear();

  const monthSales = sales.filter((s) => { const d = new Date(s.date); return d.getMonth() === monthIdx && d.getFullYear() === yearIdx; });
  const monthExp = expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === monthIdx && d.getFullYear() === yearIdx; });
  const ca = monthSales.reduce((s, x) => s + x.total, 0);
  const expTotal = monthExp.reduce((s, x) => s + x.amount, 0);
  const net = ca - expTotal;
  const margin = ca ? (net / ca) * 100 : 0;
  const marginColor = margin < 10 ? "text-destructive" : margin < 20 ? "text-warning-foreground" : "text-success";

  const prevMonthIdx = (monthIdx + 11) % 12;
  const prevYear = monthIdx === 0 ? yearIdx - 1 : yearIdx;
  const prevCa = sales.filter((s) => { const d = new Date(s.date); return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYear; }).reduce((a, b) => a + b.total, 0);
  const caDiff = prevCa ? ((ca - prevCa) / prevCa) * 100 : 0;

  const evolution = useMemo(() => {
    const out: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const r = sales.filter((s) => { const x = new Date(s.date); return x.getMonth() === m && x.getFullYear() === y; }).reduce((a, b) => a + b.total, 0);
      const e = expenses.filter((s) => { const x = new Date(s.date); return x.getMonth() === m && x.getFullYear() === y; }).reduce((a, b) => a + b.amount, 0);
      out.push({ month: d.toLocaleDateString("fr-FR", { month: "short" }), ca: r, dep: e, net: r - e });
    }
    return out;
  }, [sales, expenses]);

  const topMargin = useMemo(() => {
    const map = new Map<string, { qty: number; unitMargin: number; total: number }>();
    sales.forEach((s) => s.items.forEach((it) => {
      const cur = map.get(it.name) || { qty: 0, unitMargin: it.unitPrice - it.buyPrice, total: 0 };
      cur.qty += it.qty;
      cur.total += it.qty * (it.unitPrice - it.buyPrice);
      map.set(it.name, cur);
    }));
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([name, v]) => ({ name, ...v }));
  }, [sales]);

  const hourSlots = useMemo(() => {
    const slots = ["8h-10h", "10h-12h", "12h-14h", "14h-16h", "16h-18h", "18h-20h"];
    const counts = [0, 0, 0, 0, 0, 0];
    sales.forEach((s) => {
      const h = new Date(s.date).getHours();
      if (h >= 8 && h < 10) counts[0]++;
      else if (h >= 10 && h < 12) counts[1]++;
      else if (h >= 12 && h < 14) counts[2]++;
      else if (h >= 14 && h < 16) counts[3]++;
      else if (h >= 16 && h < 18) counts[4]++;
      else if (h >= 18 && h < 20) counts[5]++;
    });
    return slots.map((slot, i) => ({ slot, n: counts[i] }));
  }, [sales]);
  const maxHour = Math.max(...hourSlots.map((h) => h.n), 1);

  const goal = company.monthlyGoal || 0;
  const goalPct = goal ? Math.min(150, (ca / goal) * 100) : 0;
  const goalMessage = goalPct > 100 ? "Objectif dépassé ! Excellent travail."
    : goalPct >= 75 ? "Vous y êtes presque ! Continuez."
    : goalPct >= 50 ? "Bonne progression — accélérez."
    : "Il reste du chemin — mobilisez l'équipe.";

  const expByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthExp.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [monthExp]);
  const PIE_COLORS = ["#1B5E20", "#F9A825", "#25D366", "#FF6B35", "#9333ea", "#0ea5e9", "#ec4899", "#64748b", "#dc2626"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Chiffre d'affaires</div>
          <div className="mt-2 font-display font-bold text-2xl tabular-nums">{fcfa(ca)}</div>
          <div className={`text-xs mt-1 inline-flex items-center gap-1 ${caDiff >= 0 ? "text-success" : "text-destructive"}`}>
            {caDiff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {Math.abs(caDiff).toFixed(1)}% vs mois passé
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Dépenses</div>
          <div className="mt-2 font-display font-bold text-2xl tabular-nums text-destructive">{fcfa(expTotal)}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Bénéfice net</div>
          <div className="mt-2 font-display font-bold text-2xl tabular-nums text-gold">{fcfa(net)}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Marge bénéficiaire</div>
          <div className={`mt-2 font-display font-bold text-2xl tabular-nums ${marginColor}`}>{margin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold mb-3">Évolution sur 6 mois</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => (v / 1000) + "k"} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => fcfa(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ca" name="Chiffre d'affaires" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="dep" name="Dépenses" stroke="var(--color-destructive)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="net" name="Bénéfice net" stroke="var(--color-gold)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-1">Produits qui rapportent le plus</h2>
          <p className="text-xs text-muted-foreground mb-3">Classés par marge totale générée</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {topMargin.map((p, i) => {
              const max = topMargin[0]?.total || 1;
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate">{i + 1}. {p.name}</span>
                    <span className="tabular-nums font-semibold text-gold">{fcfa(p.total)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {p.qty} vendus · marge unit. {fcfa(p.unitMargin)}
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gold transition-all" style={{ width: ((p.total / max) * 100) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-1">Vos heures de pointe</h2>
          <p className="text-xs text-muted-foreground mb-3">Volume de ventes par tranche horaire</p>
          <div className="space-y-2">
            {hourSlots.map((h) => {
              const isMax = h.n === maxHour && h.n > 0;
              return (
                <div key={h.slot} className="flex items-center gap-3">
                  <div className="text-xs w-16 font-mono">{h.slot}</div>
                  <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                    <div className={`h-full transition-all ${isMax ? "bg-gold" : "bg-primary/70"}`} style={{ width: ((h.n / maxHour) * 100) + "%" }} />
                  </div>
                  <div className="text-xs tabular-nums w-12 text-right font-semibold">{h.n}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Objectif vs réalisé</h2>
          {goal === 0 ? (
            <div className="text-sm text-muted-foreground">Définissez votre objectif mensuel dans les Paramètres.</div>
          ) : (
            <div className="flex items-center gap-4">
              <Donut pct={Math.min(100, goalPct)} />
              <div>
                <div className="text-xs uppercase text-muted-foreground font-semibold">Réalisé / Objectif</div>
                <div className="text-lg font-bold tabular-nums">{fcfa(ca)} / {fcfa(goal)}</div>
                <div className="text-sm text-primary font-semibold mt-1">{goalMessage}</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Répartition des dépenses (mois)</h2>
          {expByCategory.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucune dépense ce mois.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expByCategory} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {expByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fcfa(Number(v))}
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 40, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 100 ? "var(--color-success)" : pct >= 75 ? "var(--color-gold)" : pct >= 50 ? "var(--color-primary)" : "var(--color-destructive)";
  return (
    <svg width={110} height={110} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx={50} cy={50} r={r} stroke="var(--color-muted)" strokeWidth={10} fill="none" />
      <circle cx={50} cy={50} r={r} stroke={color} strokeWidth={10} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s" }} />
      <text x={50} y={55} textAnchor="middle" className="rotate-90" transform="rotate(90 50 50)"
        style={{ fontSize: 18, fontWeight: 800, fill: "var(--color-foreground)" }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function CloturesTab() {
  const { closings } = useData();
  const [selected, setSelected] = useState<DailyClosing | null>(null);

  return (
    <>
      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">N°</th><th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5 text-right">Nb ventes</th>
              <th className="px-3 py-2.5 text-right">Total</th>
              <th className="px-3 py-2.5 text-right">Bénéfice</th>
              <th className="px-3 py-2.5 text-right">Écart</th>
              <th className="px-3 py-2.5">Caissier</th>
            </tr>
          </thead>
          <tbody>
            {closings.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c)} className="border-t border-border hover:bg-muted/30 cursor-pointer">
                <td className="px-3 py-2 font-mono text-xs">{c.number}</td>
                <td className="px-3 py-2">{formatDate(c.date)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.salesCount}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{fcfa(c.total)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-primary">{fcfa(c.profit)}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${c.diff < 0 ? "text-destructive" : c.diff > 0 ? "text-success" : ""}`}>
                  {c.diff > 0 ? "+" : ""}{fcfa(c.diff)}
                </td>
                <td className="px-3 py-2 text-xs">{c.cashier}</td>
              </tr>
            ))}
            {closings.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Aucune clôture enregistrée</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl w-full max-w-md p-5 my-8 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Clôture {selected.number}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="text-sm text-muted-foreground mb-3">{formatDate(selected.date)} · {selected.cashier}</div>
            <div className="rounded-lg border border-border divide-y divide-border text-sm">
              {Object.entries(selected.byPayment).map(([k, v]) => (
                <div key={k} className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">{k}</span><span className="tabular-nums font-semibold">{fcfa(v)}</span></div>
              ))}
              <div className="flex justify-between px-3 py-2 bg-gold/10"><span className="font-bold">Total</span><span className="tabular-nums font-bold text-gold">{fcfa(selected.total)}</span></div>
              <div className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">Bénéfice</span><span className="tabular-nums text-primary">{fcfa(selected.profit)}</span></div>
              <div className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">Articles vendus</span><span>{selected.unitsSold}</span></div>
              <div className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">Clients servis</span><span>{selected.clientsServed}</span></div>
              <div className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">Espèces comptées</span><span className="tabular-nums">{fcfa(selected.cashCounted)}</span></div>
              <div className="flex justify-between px-3 py-1.5"><span className="text-muted-foreground">Écart</span>
                <span className={`tabular-nums font-semibold ${selected.diff < 0 ? "text-destructive" : "text-success"}`}>{selected.diff > 0 ? "+" : ""}{fcfa(selected.diff)}</span>
              </div>
            </div>
            {selected.note && <p className="text-xs italic text-muted-foreground mt-3">"{selected.note}"</p>}
          </div>
        </div>
      )}
    </>
  );
}
