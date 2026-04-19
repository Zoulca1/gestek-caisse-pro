import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { STORES } from "@/lib/seed";
import { fcfa, formatDate } from "@/lib/format";
import { useState } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Transfer } from "@/lib/types";

export const Route = createFileRoute("/transferts")({
  component: () => <ProtectedLayout require="stock"><TransfertsPage /></ProtectedLayout>,
});

function TransfertsPage() {
  const { products, setProducts, transfers, setTransfers } = useData();
  const [from, setFrom] = useState("yopougon");
  const [to, setTo] = useState("selmer");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(0);

  const productSelected = products.find((p) => p.id === productId);
  const availableQty = productSelected ? productSelected.stockByStore[from] || 0 : 0;

  const submit = () => {
    if (from === to) { toast.error("Sélectionnez deux magasins différents"); return; }
    if (!productSelected || qty <= 0) { toast.error("Renseignez le produit et la quantité"); return; }
    if (qty > availableQty) { toast.error("Quantité supérieure au stock disponible"); return; }

    const num = "TR-" + String(transfers.length + 1).padStart(3, "0");
    const t: Transfer = {
      id: "t" + Date.now(), number: num, date: new Date().toISOString(),
      fromStore: from, toStore: to,
      productId: productSelected.id, productName: productSelected.name, qty,
    };
    setTransfers([t, ...transfers]);
    setProducts(products.map((p) => p.id === productSelected.id
      ? { ...p, stockByStore: { ...p.stockByStore, [from]: p.stockByStore[from] - qty, [to]: (p.stockByStore[to] || 0) + qty } }
      : p));
    toast.success(`Transfert ${num} effectué`);
    setProductId(""); setQty(0);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Transferts entre magasins</h1>
        <p className="text-sm text-muted-foreground">Gérez les flux entre vos points de vente.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {STORES.map((s) => {
          const total = products.reduce((sum, p) => sum + (p.stockByStore[s.id] || 0), 0);
          const value = products.reduce((sum, p) => sum + (p.stockByStore[s.id] || 0) * p.buyPrice, 0);
          const alerts = products.filter((p) => (p.stockByStore[s.id] || 0) === 0).length;
          return (
            <div key={s.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="text-xs uppercase font-semibold text-muted-foreground">{s.name}</div>
              <div className="mt-2 font-display font-bold text-2xl tabular-nums">{total.toLocaleString("fr-FR")} u.</div>
              <div className="text-xs text-muted-foreground">{fcfa(value)} en stock</div>
              {alerts > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-semibold">
                  <AlertTriangle className="h-3 w-3" /> {alerts} rupture{alerts > 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold mb-3">Nouveau transfert</h2>
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">De</span>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full input">
              {STORES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid place-items-center pb-2"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Vers</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full input">
              {STORES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Produit</span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1 w-full input">
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {productSelected && <div className="text-xs text-muted-foreground mt-1">Disponible : {availableQty}</div>}
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Quantité</span>
            <input type="number" value={qty} max={availableQty} onChange={(e) => setQty(Math.min(+e.target.value, availableQty))} className="mt-1 w-full input" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">Effectuer le transfert</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Stock croisé</h2>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-2 py-2">Produit</th>
                  {STORES.map((s) => <th key={s.id} className="px-2 py-2 text-right">{s.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-2 py-1.5 truncate max-w-[140px]">{p.emoji} {p.name}</td>
                    {STORES.map((s) => {
                      const v = p.stockByStore[s.id] || 0;
                      return <td key={s.id} className={`px-2 py-1.5 text-right tabular-nums ${v === 0 ? "text-destructive font-semibold" : ""}`}>{v}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="font-display font-bold mb-3">Historique</h2>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-2 py-2">N°</th><th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Trajet</th><th className="px-2 py-2">Produit</th><th className="px-2 py-2 text-right">Qté</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-2 py-1.5 font-mono text-primary">{t.number}</td>
                    <td className="px-2 py-1.5 text-xs">{formatDate(t.date)}</td>
                    <td className="px-2 py-1.5 text-xs">{t.fromStore} → {t.toStore}</td>
                    <td className="px-2 py-1.5 truncate max-w-[120px]">{t.productName}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{t.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`.input{padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
    </div>
  );
}
