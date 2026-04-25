import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import { fcfa, formatDate } from "@/lib/format";

export const Route = createFileRoute("/workspace/entrees")({
  component: StockEntriesCloud,
});

interface Product { id: string; name: string; stock_quantity: number; cost_price: number | null; sale_price: number }
interface Supplier { id: string; name: string }

interface Entry {
  id: string; entry_date: string; label: string; reference: string | null;
  amount: number; category: string | null; notes: string | null;
}

function StockEntriesCloud() {
  const { tenant, isAdmin } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const [{ data: p }, { data: s }, { data: e }] = await Promise.all([
      supabase.from("products").select("id, name, stock_quantity, cost_price, sale_price").eq("tenant_id", tenant.id).eq("active", true).order("name"),
      supabase.from("suppliers").select("id, name").eq("tenant_id", tenant.id).order("name"),
      supabase.from("accounting_entries").select("*").eq("tenant_id", tenant.id).eq("category", "achat_stock").order("entry_date", { ascending: false }).limit(50),
    ]);
    setProducts((p || []) as Product[]);
    setSuppliers((s || []) as Supplier[]);
    setEntries((e || []) as Entry[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Entrées de stock</h1>
          <p className="text-sm text-muted-foreground">Réceptions et approvisionnements.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nouvelle entrée
          </button>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Truck className="mx-auto h-8 w-8 mb-2 opacity-50" />
            Aucune entrée enregistrée.
          </div>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-4 py-2.5">Article / fournisseur</th>
                <th className="text-left px-4 py-2.5">Référence</th>
                <th className="text-right px-4 py-2.5">Coût total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(e.entry_date)}</td>
                  <td className="px-4 py-2.5 font-medium">{e.label}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{e.reference || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fcfa(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && tenant && (
        <EntryForm
          tenantId={tenant.id}
          products={products}
          suppliers={suppliers}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function EntryForm({ tenantId, products, suppliers, onClose, onSaved }: {
  tenantId: string; products: Product[]; suppliers: Supplier[]; onClose: () => void; onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const product = products.find((p) => p.id === productId);
  const supplier = suppliers.find((s) => s.id === supplierId);
  const total = quantity * unitCost;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return toast.error("Sélectionnez un article");
    if (quantity <= 0) return toast.error("Quantité invalide");
    setSaving(true);

    // 1. Update stock + cost
    const newStock = Number(product.stock_quantity) + quantity;
    const { error: stockErr } = await supabase.from("products").update({
      stock_quantity: newStock,
      cost_price: unitCost > 0 ? unitCost : product.cost_price,
    }).eq("id", product.id);

    if (stockErr) { setSaving(false); return toast.error(stockErr.message); }

    // 2. Record accounting entry
    if (total > 0) {
      const label = `Entrée stock : ${product.name}${supplier ? ` (${supplier.name})` : ""} × ${quantity}`;
      await supabase.from("accounting_entries").insert({
        tenant_id: tenantId, entry_type: "expense", category: "achat_stock",
        label, amount: total, reference: reference || null, notes: notes || null,
        payment_method: "especes",
      });
    }

    setSaving(false);
    toast.success(`Stock mis à jour : ${product.name} (+${quantity})`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-md p-5 space-y-3 border border-border">
        <h2 className="font-display font-bold text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Nouvelle entrée</h2>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Article *</span>
          <select value={productId} onChange={(e) => { setProductId(e.target.value); const p = products.find((x) => x.id === e.target.value); if (p?.cost_price) setUnitCost(Number(p.cost_price)); }}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="">— Choisir —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_quantity})</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Fournisseur</span>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="">— Aucun —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Quantité *</span>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Coût unitaire</span>
            <input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase">N° bon de livraison</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </label>

        <textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />

        <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
          <span className="text-muted-foreground">Coût total :</span>
          <span className="font-bold">{fcfa(total)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : "Valider"}
          </button>
        </div>
      </form>
    </div>
  );
}
