import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, TrendingUp, ShoppingCart, Package, Download } from "lucide-react";
import { toast } from "sonner";
import { fcfa, formatDate } from "@/lib/format";

export const Route = createFileRoute("/workspace/rapports")({
  component: ReportsCloud,
});

type Period = "7" | "30" | "90";

interface Sale { id: string; total: number; sold_at: string; payment_method: string; reference: string }
interface Entry { amount: number; entry_type: string; entry_date: string }

function ReportsCloud() {
  const { tenant } = useTenant();
  const [period, setPeriod] = useState<Period>("30");
  const [sales, setSales] = useState<Sale[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from("sales").select("id, total, sold_at, payment_method, reference").eq("tenant_id", tenant.id).gte("sold_at", since).order("sold_at", { ascending: false }),
      supabase.from("accounting_entries").select("amount, entry_type, entry_date").eq("tenant_id", tenant.id).gte("entry_date", since.split("T")[0]),
    ]);
    setSales((s || []) as Sale[]);
    setEntries((e || []) as Entry[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant, period]);

  const ca = sales.reduce((s, x) => s + Number(x.total), 0);
  const nbVentes = sales.length;
  const ticketMoyen = nbVentes > 0 ? ca / nbVentes : 0;
  const depenses = entries.filter((e) => e.entry_type === "expense").reduce((s, x) => s + Number(x.amount), 0);
  const benefice = ca - depenses;

  // Group sales by day
  const byDay = new Map<string, number>();
  sales.forEach((s) => {
    const d = s.sold_at.split("T")[0];
    byDay.set(d, (byDay.get(d) || 0) + Number(s.total));
  });
  const chartData = Array.from(byDay.entries()).sort().slice(-14);
  const maxVal = Math.max(1, ...chartData.map(([, v]) => v));

  // Payment methods breakdown
  const byMethod = new Map<string, number>();
  sales.forEach((s) => byMethod.set(s.payment_method, (byMethod.get(s.payment_method) || 0) + Number(s.total)));

  const exportCSV = () => {
    const rows = [["Référence", "Date", "Mode paiement", "Total"]];
    sales.forEach((s) => rows.push([s.reference, formatDate(s.sold_at), s.payment_method, String(s.total)]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ventes-${period}j.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Rapports</h1>
          <p className="text-sm text-muted-foreground">Performance commerciale sur {period} jours.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
          </select>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={TrendingUp} label="Chiffre d'affaires" value={fcfa(ca)} accent="text-emerald-600" />
            <Kpi icon={ShoppingCart} label="Ventes" value={String(nbVentes)} />
            <Kpi icon={Package} label="Ticket moyen" value={fcfa(ticketMoyen)} />
            <Kpi icon={TrendingUp} label="Bénéfice estimé" value={fcfa(benefice)} accent={benefice >= 0 ? "text-emerald-600" : "text-destructive"} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-lg mb-4">Évolution des ventes</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune vente sur la période.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {chartData.map(([d, v]) => (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 tabular-nums">{Math.round(v / 1000)}k</div>
                    <div className="w-full bg-primary rounded-t" style={{ height: `${(v / maxVal) * 100}%`, minHeight: 2 }} title={`${d}: ${fcfa(v)}`} />
                    <div className="text-[10px] text-muted-foreground tabular-nums">{d.slice(8, 10)}/{d.slice(5, 7)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-lg mb-3">Répartition par mode de paiement</h3>
            {byMethod.size === 0 ? (
              <p className="text-sm text-muted-foreground py-4">—</p>
            ) : (
              <div className="space-y-2">
                {Array.from(byMethod.entries()).map(([m, v]) => (
                  <div key={m} className="flex items-center gap-3">
                    <div className="w-28 text-sm capitalize">{m}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(v / ca) * 100}%` }} />
                    </div>
                    <div className="text-sm font-semibold tabular-nums w-32 text-right">{fcfa(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`text-xl md:text-2xl font-bold tabular-nums mt-1 ${accent || ""}`}>{value}</div>
    </div>
  );
}
