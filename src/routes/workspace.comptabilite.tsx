import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/comptabilite")({
  component: AccountingCloud,
});

interface Entry {
  id: string; entry_type: string; amount: number; label: string;
  category: string | null; payment_method: string | null; entry_date: string;
  reference: string | null; notes: string | null;
}

function AccountingCloud() {
  const { tenant, isAdmin } = useTenant();
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase.from("accounting_entries").select("*").eq("tenant_id", tenant.id).order("entry_date", { ascending: false });
    if (error) toast.error(error.message); else setItems((data || []) as Entry[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  const totals = useMemo(() => {
    const inc = items.filter((e) => e.entry_type === "income").reduce((s, e) => s + Number(e.amount), 0);
    const exp = items.filter((e) => e.entry_type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    return { inc, exp, balance: inc - exp };
  }, [items]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: tenant?.currency || "XOF", maximumFractionDigits: 0 }).format(n);

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette écriture ?")) return;
    const { error } = await supabase.from("accounting_entries").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Comptabilité</h1>
          <p className="text-sm text-muted-foreground">Suivez vos revenus et dépenses.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nouvelle écriture
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Revenus" value={fmt(totals.inc)} tone="success" />
        <StatCard icon={TrendingDown} label="Dépenses" value={fmt(totals.exp)} tone="destructive" />
        <StatCard icon={Wallet} label="Solde" value={fmt(totals.balance)} tone={totals.balance >= 0 ? "success" : "destructive"} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucune écriture. Ajoutez votre première opération.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-4 py-2.5">Libellé</th>
                <th className="text-left px-4 py-2.5">Catégorie</th>
                <th className="text-left px-4 py-2.5">Type</th>
                <th className="text-right px-4 py-2.5">Montant</th>
                {isAdmin && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(e.entry_date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-2.5 font-medium">{e.label}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.category || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.entry_type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {e.entry_type === "income" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${e.entry_type === "income" ? "text-success" : "text-destructive"}`}>
                    {e.entry_type === "income" ? "+" : "−"}{fmt(Number(e.amount))}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => remove(e.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && tenant && (
        <EntryForm tenantId={tenant.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "success" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : "text-destructive";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className={`h-4 w-4 ${cls}`} />
      </div>
      <div className={`mt-2 font-display font-bold text-2xl tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function EntryForm({ tenantId, onClose, onSaved }: { tenantId: string; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("especes");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return toast.error("Libellé et montant obligatoires");
    setSaving(true);
    const { error } = await supabase.from("accounting_entries").insert({
      tenant_id: tenantId, entry_type: type, label: label.trim(), amount: Number(amount),
      category: category.trim() || null, payment_method: paymentMethod, entry_date: entryDate,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Écriture enregistrée"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-md p-5 space-y-3 border border-border">
        <h2 className="font-display font-bold text-lg">Nouvelle écriture</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("expense")}
            className={`py-2 rounded-lg text-sm font-semibold ${type === "expense" ? "bg-destructive text-destructive-foreground" : "border border-border"}`}>
            Dépense
          </button>
          <button type="button" onClick={() => setType("income")}
            className={`py-2 rounded-lg text-sm font-semibold ${type === "income" ? "bg-success text-success-foreground" : "border border-border"}`}>
            Revenu
          </button>
        </div>
        <Field label="Libellé *" value={label} onChange={setLabel} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant *" value={amount} onChange={setAmount} type="number" />
          <Field label="Date" value={entryDate} onChange={setEntryDate} type="date" />
        </div>
        <Field label="Catégorie" value={category} onChange={setCategory} />
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Mode de paiement</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="especes">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="carte">Carte</option>
            <option value="virement">Virement</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
    </label>
  );
}
