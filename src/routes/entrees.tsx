import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate } from "@/lib/format";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { StockEntry } from "@/lib/types";

export const Route = createFileRoute("/entrees")({
  component: () => <ProtectedLayout require="stock"><EntreesPage /></ProtectedLayout>,
});

function EntreesPage() {
  const { entries, setEntries, products, suppliers, setProducts } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplierId: "", productId: "", qty: 0, unitBuyPrice: 0,
    date: new Date().toISOString().slice(0, 10),
    expiry: "",
  });

  const reset = () => setForm({ supplierId: "", productId: "", qty: 0, unitBuyPrice: 0, date: new Date().toISOString().slice(0, 10), expiry: "" });

  const save = () => {
    if (!form.supplierId || !form.productId || form.qty <= 0) { toast.error("Remplissez tous les champs"); return; }
    const supplier = suppliers.find((s) => s.id === form.supplierId)!;
    const product = products.find((p) => p.id === form.productId)!;
    const num = "BON-" + String(entries.length + 1).padStart(3, "0");
    const e: StockEntry = {
      id: "e" + Date.now(), number: num, date: new Date(form.date).toISOString(),
      supplierId: supplier.id, supplierName: supplier.name,
      productId: product.id, productName: product.name,
      qty: form.qty, unitBuyPrice: form.unitBuyPrice || product.buyPrice,
      expiry: form.expiry ? new Date(form.expiry).toISOString() : product.expiry,
    };
    setEntries([e, ...entries]);
    // ajouter au stock yopougon
    setProducts(products.map((p) => p.id === product.id
      ? { ...p, stockByStore: { ...p.stockByStore, yopougon: (p.stockByStore.yopougon || 0) + form.qty } }
      : p));
    toast.success(`Entrée ${num} enregistrée`);
    setOpen(false); reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Entrées de stock</h1>
          <p className="text-sm text-muted-foreground">Bons de réception fournisseurs.</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">
          <Plus className="h-4 w-4" /> Nouvelle entrée
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">N° Bon</th><th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Fournisseur</th><th className="px-3 py-2.5">Produit</th>
              <th className="px-3 py-2.5 text-right">Quantité</th><th className="px-3 py-2.5 text-right">PU achat</th>
              <th className="px-3 py-2.5 text-right">Total</th><th className="px-3 py-2.5">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-3 py-2.5 font-mono font-semibold text-primary">{e.number}</td>
                <td className="px-3 py-2.5">{formatDate(e.date)}</td>
                <td className="px-3 py-2.5">{e.supplierName}</td>
                <td className="px-3 py-2.5">{e.productName}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{e.qty}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(e.unitBuyPrice)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(e.qty * e.unitBuyPrice)}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(e.expiry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl border border-border max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-bold">Nouvelle entrée</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              <Field label="Fournisseur">
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="input">
                  <option value="">—</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Produit">
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input">
                  <option value="">—</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Quantité"><input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: +e.target.value })} className="input" /></Field>
              <Field label="Prix d'achat unitaire"><input type="number" value={form.unitBuyPrice} onChange={(e) => setForm({ ...form, unitBuyPrice: +e.target.value })} className="input" /></Field>
              <Field label="Date de réception"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" /></Field>
              <Field label="Date d'expiration"><input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="input" /></Field>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span><div className="mt-1">{children}</div></label>;
}
