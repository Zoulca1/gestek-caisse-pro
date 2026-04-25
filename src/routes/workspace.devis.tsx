import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Trash2, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { fcfa, formatDate } from "@/lib/format";

export const Route = createFileRoute("/workspace/devis")({
  component: QuotesCloud,
});

interface QuoteItem { name: string; qty: number; price: number }
interface Quote {
  id: string; reference: string; customer_name: string | null; status: string;
  subtotal: number; discount: number; tax: number; total: number;
  valid_until: string | null; notes: string | null; created_at: string; items: QuoteItem[];
}

function QuotesCloud() {
  const { tenant, isAdmin } = useTenant();
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase.from("quotes").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data || []).map((q: any) => ({ ...q, items: Array.isArray(q.items) ? q.items : [] })) as Quote[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce devis ?")) return;
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  const printQuote = (q: Quote) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const rows = q.items.map((i) => `<tr><td>${i.name}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right">${fcfa(i.price)}</td><td style="text-align:right">${fcfa(i.qty * i.price)}</td></tr>`).join("");
    w.document.write(`<html><head><title>Devis ${q.reference}</title>
      <style>body{font-family:system-ui;padding:40px;color:#0f172a}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}.tot{font-weight:bold;font-size:18px}.head{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px}</style>
      </head><body>
      <div class="head"><div><h1>${tenant?.name || ""}</h1><div>Devis</div></div><div style="text-align:right"><div><strong>N° ${q.reference}</strong></div><div>${formatDate(q.created_at)}</div>${q.valid_until ? `<div>Valable jusqu'au ${formatDate(q.valid_until)}</div>` : ""}</div></div>
      <p><strong>Client :</strong> ${q.customer_name || "—"}</p>
      <table><thead><tr><th>Désignation</th><th style="text-align:right">Qté</th><th style="text-align:right">P.U.</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:20px;text-align:right"><div>Sous-total : ${fcfa(q.subtotal)}</div>${q.discount ? `<div>Remise : -${fcfa(q.discount)}</div>` : ""}${q.tax ? `<div>TVA : ${fcfa(q.tax)}</div>` : ""}<div class="tot">TOTAL : ${fcfa(q.total)}</div></div>
      ${q.notes ? `<p style="margin-top:30px;color:#64748b"><em>${q.notes}</em></p>` : ""}
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Devis</h1>
          <p className="text-sm text-muted-foreground">{items.length} devis · imprimables en PDF.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nouveau devis
          </button>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            Aucun devis pour le moment.
          </div>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Référence</th>
                <th className="text-left px-4 py-2.5">Client</th>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-right px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{q.reference}</td>
                  <td className="px-4 py-2.5">{q.customer_name || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(q.created_at)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fcfa(q.total)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => printQuote(q)} className="p-1.5 rounded hover:bg-muted" title="Imprimer"><Printer className="h-4 w-4" /></button>
                      {isAdmin && <button onClick={() => remove(q.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && tenant && <QuoteForm tenantId={tenant.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function QuoteForm({ tenantId, onClose, onSaved }: { tenantId: string; onClose: () => void; onSaved: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([{ name: "", qty: 1, price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = Math.max(0, subtotal - discount);

  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.some((i) => i.name && i.qty > 0)) return toast.error("Ajoutez au moins une ligne");
    setSaving(true);
    const reference = "DEV-" + Date.now().toString(36).toUpperCase();
    const cleanItems = items.filter((i) => i.name && i.qty > 0);
    const { error } = await supabase.from("quotes").insert({
      tenant_id: tenantId, reference, customer_name: customerName.trim() || null,
      valid_until: validUntil || null, notes: notes.trim() || null,
      items: cleanItems as any, subtotal, discount, tax: 0, total, status: "draft",
    });
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Devis créé"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-2xl p-5 space-y-3 border border-border my-8">
        <h2 className="font-display font-bold text-lg">Nouveau devis</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Client</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Valable jusqu'au</span>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Lignes</div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input placeholder="Désignation" value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} className="col-span-6 px-2 py-1.5 rounded border border-input bg-background text-sm" />
              <input type="number" min={0} placeholder="Qté" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} className="col-span-2 px-2 py-1.5 rounded border border-input bg-background text-sm" />
              <input type="number" min={0} placeholder="Prix" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} className="col-span-3 px-2 py-1.5 rounded border border-input bg-background text-sm" />
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="col-span-1 p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { name: "", qty: 1, price: 0 }])} className="text-xs text-primary font-semibold">+ Ajouter une ligne</button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Remise</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <div className="text-right self-end">
            <div className="text-xs text-muted-foreground">Sous-total : {fcfa(subtotal)}</div>
            <div className="text-lg font-bold">Total : {fcfa(total)}</div>
          </div>
        </div>

        <textarea placeholder="Notes / conditions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : "Créer le devis"}
          </button>
        </div>
      </form>
    </div>
  );
}
