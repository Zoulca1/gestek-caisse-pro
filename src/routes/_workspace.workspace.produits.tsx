import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_workspace/workspace/produits")({
  component: ProductsCloud,
});

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  sale_price: number;
  cost_price: number | null;
  stock_quantity: number;
  stock_alert: number | null;
  active: boolean;
}

function ProductsCloud() {
  const { tenant, isAdmin } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenant]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Produit supprimé");
      load();
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: tenant?.currency || "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Produits</h1>
          <p className="text-sm text-muted-foreground">{products.length} produit{products.length > 1 ? "s" : ""} dans votre catalogue.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nouveau produit
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {products.length === 0 ? "Aucun produit. Créez votre premier produit." : "Aucun résultat."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Nom</th>
                <th className="text-left px-4 py-2.5">SKU</th>
                <th className="text-left px-4 py-2.5">Catégorie</th>
                <th className="text-right px-4 py-2.5">Prix</th>
                <th className="text-right px-4 py-2.5">Stock</th>
                {isAdmin && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.sku || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmt(Number(p.sale_price))}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${Number(p.stock_quantity) <= Number(p.stock_alert || 0) ? "text-destructive font-semibold" : ""}`}>
                    {Number(p.stock_quantity)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => remove(p.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && tenant && (
        <ProductForm
          tenantId={tenant.id}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ tenantId, onClose, onSaved }: { tenantId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salePrice) return toast.error("Nom et prix obligatoires");
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      tenant_id: tenantId,
      name: name.trim(),
      sku: sku.trim() || null,
      category: category.trim() || null,
      sale_price: Number(salePrice),
      cost_price: costPrice ? Number(costPrice) : 0,
      stock_quantity: Number(stock) || 0,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Produit créé");
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-md p-5 space-y-3 border border-border">
        <h2 className="font-display font-bold text-lg">Nouveau produit</h2>
        <Field label="Nom *" value={name} onChange={setName} />
        <Field label="SKU" value={sku} onChange={setSku} />
        <Field label="Catégorie" value={category} onChange={setCategory} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix vente *" value={salePrice} onChange={setSalePrice} type="number" />
          <Field label="Prix d'achat" value={costPrice} onChange={setCostPrice} type="number" />
        </div>
        <Field label="Stock initial" value={stock} onChange={setStock} type="number" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : "Créer"}
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
      />
    </label>
  );
}
