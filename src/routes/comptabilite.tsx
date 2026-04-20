import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { fcfa, formatDate } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";
import { useMemo, useState } from "react";
import { Plus, Download, ArrowUp, ArrowDown, Wallet, TrendingDown, Coins } from "lucide-react";
import { toast } from "sonner";
import type { Expense, ExpenseCategory } from "@/lib/types";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/comptabilite")({
  component: () => <ProtectedLayout><ComptabilitePage /></ProtectedLayout>,
});

const CATEGORIES: ExpenseCategory[] = [
  "Loyer", "Salaires", "Électricité", "Eau", "Internet",
  "Transport", "Achat marchandise", "Taxes", "Autre",
];

function MetricCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  const v = useCountUp(value);
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-2 font-display font-bold text-2xl md:text-3xl tabular-nums ${color}`}>
        {v.toLocaleString("fr-FR")} FCFA
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ComptabilitePage() {
  const { sales, expenses, setExpenses } = useData();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois" | "custom">("mois");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [form, setForm] = useState({
    category: "Loyer" as ExpenseCategory,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const today = new Date();
  const todayStr = today.toDateString();
  const monthIdx = today.getMonth();
  const yearIdx = today.getFullYear();

  // Solde du jour
  const dailySales = sales.filter((s) => new Date(s.date).toDateString() === todayStr);
  const dailyRev = dailySales.reduce((a, b) => a + b.total, 0);
  const dailyExp = expenses.filter((e) => new Date(e.date).toDateString() === todayStr).reduce((a, b) => a + b.amount, 0);
  const dailyNet = dailyRev - dailyExp;

  // Solde du mois
  const monthSales = sales.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === monthIdx && d.getFullYear() === yearIdx;
  });
  const monthRev = monthSales.reduce((a, b) => a + b.total, 0);
  const monthExp = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === monthIdx && d.getFullYear() === yearIdx;
  }).reduce((a, b) => a + b.amount, 0);
  const monthNet = monthRev - monthExp;

  const prevMonthIdx = (monthIdx + 11) % 12;
  const prevYear = monthIdx === 0 ? yearIdx - 1 : yearIdx;
  const prevMonthRev = sales.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYear;
  }).reduce((a, b) => a + b.total, 0);
  const prevMonthExp = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYear;
  }).reduce((a, b) => a + b.amount, 0);
  const prevMonthNet = prevMonthRev - prevMonthExp;
  const monthDiff = prevMonthNet ? ((monthNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100 : 0;

  // Filtre historique
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (period === "jour") return d.toDateString() === now.toDateString();
      if (period === "semaine") {
        const diff = (now.getTime() - d.getTime()) / 86400000;
        return diff >= 0 && diff <= 7;
      }
      if (period === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === "custom") {
        if (!customFrom || !customTo) return true;
        return d >= new Date(customFrom) && d <= new Date(customTo + "T23:59:59");
      }
      return true;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [expenses, period, customFrom, customTo]);

  // Graphique 6 mois
  const chart6 = useMemo(() => {
    const out: { month: string; rev: number; exp: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const rev = sales.filter((s) => {
        const x = new Date(s.date);
        return x.getMonth() === m && x.getFullYear() === y;
      }).reduce((a, b) => a + b.total, 0);
      const exp = expenses.filter((e) => {
        const x = new Date(e.date);
        return x.getMonth() === m && x.getFullYear() === y;
      }).reduce((a, b) => a + b.amount, 0);
      out.push({
        month: d.toLocaleDateString("fr-FR", { month: "short" }),
        rev, exp, net: rev - exp,
      });
    }
    return out;
  }, [sales, expenses]);

  const submitExpense = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error("Montant invalide"); return; }
    if (!form.description.trim()) { toast.error("Description requise"); return; }
    const newExp: Expense = {
      id: "exp-" + Date.now(),
      date: new Date(form.date).toISOString(),
      category: form.category,
      description: form.description.trim(),
      amount: amt,
      createdBy: user?.name || "Utilisateur",
    };
    setExpenses([newExp, ...expenses]);
    setForm({ category: "Loyer", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
    toast.success("Dépense enregistrée");
  };

  const exportCSV = () => {
    const header = "Date,Catégorie,Description,Montant,Saisi par\n";
    const rows = filteredExpenses.map((e) =>
      `${new Date(e.date).toISOString()},${e.category},"${e.description}",${e.amount},${e.createdBy}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "depenses-koffi.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Comptabilité</h1>
        <p className="text-sm text-muted-foreground">Recettes, dépenses et bénéfice net.</p>
      </div>

      {/* Solde du jour */}
      <section>
        <h2 className="font-display font-bold text-lg mb-2">Solde du jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard label="Recettes du jour" value={dailyRev} color="text-success" />
          <MetricCard label="Dépenses du jour" value={dailyExp} color="text-destructive" />
          <MetricCard label="Bénéfice net du jour" value={dailyNet} color="text-gold" />
        </div>
      </section>

      {/* Solde du mois */}
      <section>
        <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
          Solde du mois
          {prevMonthNet !== 0 && (
            <span className={`text-xs font-semibold inline-flex items-center gap-1 ${monthDiff >= 0 ? "text-success" : "text-destructive"}`}>
              {monthDiff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(monthDiff).toFixed(1)}% vs mois précédent
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard label="Recettes du mois" value={monthRev} color="text-success" sub={`vs ${fcfa(prevMonthRev)} mois passé`} />
          <MetricCard label="Dépenses du mois" value={monthExp} color="text-destructive" sub={`vs ${fcfa(prevMonthExp)} mois passé`} />
          <MetricCard label="Bénéfice net du mois" value={monthNet} color="text-gold" sub={`vs ${fcfa(prevMonthNet)} mois passé`} />
        </div>
      </section>

      {/* Enregistrer une dépense */}
      <section className="p-5 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" /> Enregistrer une dépense
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Catégorie</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Montant FCFA</span>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="0" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Ex: facture CIE" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Date</span>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={submitExpense} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">
            <Plus className="h-4 w-4" /> Enregistrer la dépense
          </button>
        </div>
      </section>

      {/* Historique */}
      <section className="p-5 rounded-xl bg-card border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Historique des dépenses
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm">
              <option value="jour">Aujourd'hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
              <option value="custom">Personnalisée</option>
            </select>
            {period === "custom" && (
              <>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-input bg-background text-sm" />
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-input bg-background text-sm" />
              </>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold text-gold-foreground text-sm font-semibold">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Catégorie</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5 text-right">Montant</th>
                <th className="px-3 py-2.5">Saisi par</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{e.category}</span></td>
                  <td className="px-3 py-2.5">{e.description}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-destructive">{fcfa(e.amount)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{e.createdBy}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune dépense sur cette période</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Résumé mensuel */}
      <section className="p-5 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Coins className="h-5 w-5 text-gold" /> Résumé des 6 derniers mois
        </h2>
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={chart6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => (v / 1000) + "k"} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => fcfa(Number(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rev" name="Recettes" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exp" name="Dépenses" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" name="Bénéfice net" stroke="var(--color-gold)" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
