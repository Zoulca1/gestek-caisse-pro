import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, ArrowRightLeft, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/transferts")({
  component: TransfersCloud,
});

interface Product { id: string; name: string; stock_quantity: number; sku: string | null }

function TransfersCloud() {
  const { tenant, isAdmin } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase.from("products").select("id, name, stock_quantity, sku").eq("tenant_id", tenant.id).eq("active", true).order("name");
    if (error) toast.error(error.message);
    else setProducts((data || []) as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  const adjust = async (p: Product, delta: number) => {
    const reason = delta > 0 ? "Entrée manuelle" : "Sortie / ajustement";
    const qtyStr = prompt(`${reason} pour "${p.name}"\nStock actuel : ${p.stock_quantity}\n\nQuantité ${delta > 0 ? "à ajouter" : "à retirer"} :`, "1");
    if (!qtyStr) return;
    const qty = Math.abs(Number(qtyStr));
    if (!qty || isNaN(qty)) return toast.error("Quantité invalide");
    const newStock = Number(p.stock_quantity) + delta * qty;
    if (newStock < 0) return toast.error("Stock insuffisant");
    const { error } = await supabase.from("products").update({ stock_quantity: newStock }).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success(`Stock mis à jour : ${newStock}`); load(); }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()));
  const lowStock = products.filter((p) => p.stock_quantity <= 5).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Transferts & ajustements</h1>
          <p className="text-sm text-muted-foreground">Ajustez manuellement le stock (casse, perte, transfert).</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Articles</div>
          <div className="text-2xl font-bold tabular-nums">{products.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Stock bas (≤5)</div>
          <div className={`text-2xl font-bold tabular-nums ${lowStock > 0 ? "text-amber-600" : ""}`}>{lowStock}</div>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article..." className="w-full md:max-w-sm px-3 py-2 rounded-lg border border-input bg-background text-sm" />

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <ArrowRightLeft className="mx-auto h-8 w-8 mb-2 opacity-50" />
            Aucun article.
          </div>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Article</th>
                <th className="text-left px-4 py-2.5">SKU</th>
                <th className="text-right px-4 py-2.5">Stock</th>
                {isAdmin && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${Number(p.stock_quantity) <= 5 ? "text-amber-600" : ""}`}>{p.stock_quantity}</td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => adjust(p, +1)} className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-600" title="Entrée"><Plus className="h-4 w-4" /></button>
                        <button onClick={() => adjust(p, -1)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Sortie"><Minus className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
