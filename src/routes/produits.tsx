import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate, daysUntil } from "@/lib/format";
import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/produits")({
  component: () => <ProtectedLayout require="stock"><ProduitsPage /></ProtectedLayout>,
});

const EMPTY: Product = {
  id: "", emoji: "📦", name: "", ref: "", barcode: "", category: "Divers",
  buyPrice: 0, sellPrice: 0, stockByStore: { yopougon: 0, selmer: 0, abobo: 0 },
  threshold: 5, expiry: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
};

function ExpiryBadge({ iso }: { iso: string }) {
  const d = daysUntil(iso);
  if (d < 0) return <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">Expiré</span>;
  if (d <= 30) return <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground text-xs font-semibold">{d}j restants</span>;
  return <span className="text-xs text-success font-medium">{formatDate(iso)}</span>;
}

function ProduitsPage() {
  const { products, setProducts } = useData();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Tous");
  const [editing, setEditing] = useState<Product | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const cats = useMemo(() => ["Tous", ...new Set(products.map((p) => p.category))], [products]);

  const filtered = products.filter((p) =>
    (cat === "Tous" || p.category === cat) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query) || p.ref.toLowerCase().includes(query.toLowerCase()))
  );

  const openNew = () => { setEditing({ ...EMPTY }); setPhotoPreview(null); };
  const openEdit = (p: Product) => { setEditing({ ...p }); setPhotoPreview(null); };
  const close = () => { setEditing(null); setPhotoPreview(null); };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Le nom est requis"); return; }
    if (editing.id) {
      setProducts(products.map((p) => p.id === editing.id ? editing : p));
      toast.success("Produit mis à jour");
    } else {
      setProducts([...products, { ...editing, id: "p" + Date.now() }]);
      toast.success("Produit ajouté");
    }
    close();
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Produit supprimé");
  };

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Produits & catalogue</h1>
          <p className="text-sm text-muted-foreground">{products.length} références au catalogue.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2.5">Produit</th>
              <th className="px-3 py-2.5">Catégorie</th>
              <th className="px-3 py-2.5 text-right">Achat</th>
              <th className="px-3 py-2.5 text-right">Vente</th>
              <th className="px-3 py-2.5 text-right">Marge</th>
              <th className="px-3 py-2.5 text-right">Stock</th>
              <th className="px-3 py-2.5">Expiration</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const stock = Object.values(p.stockByStore).reduce((a, b) => a + b, 0);
              const margin = p.sellPrice - p.buyPrice;
              const marginPct = (margin / p.buyPrice) * 100;
              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.ref} · {p.barcode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{p.category}</span></td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(p.buyPrice)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(p.sellPrice)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-primary">{fcfa(margin)} <span className="text-xs">({marginPct.toFixed(0)}%)</span></td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${stock === 0 ? "text-destructive" : stock <= p.threshold ? "text-warning-foreground" : ""}`}>{stock}</td>
                  <td className="px-3 py-2.5"><ExpiryBadge iso={p.expiry} /></td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={close}>
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-bold">{editing.id ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button onClick={close} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex items-center gap-3">
                <div className="h-20 w-20 rounded-lg bg-muted grid place-items-center text-4xl overflow-hidden">
                  {photoPreview ? <img src={photoPreview} className="h-full w-full object-cover" /> : <span>{editing.emoji}</span>}
                </div>
                <label className="flex-1">
                  <span className="text-xs text-muted-foreground">Photo (optionnel)</span>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-xs hover:bg-muted">
                      <ImageIcon className="h-3.5 w-3.5" /> Choisir
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
                    </label>
                    <input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                      className="w-16 px-2 py-1.5 text-center text-lg rounded-lg border border-input bg-background" />
                  </div>
                </label>
              </div>
              <Field label="Désignation"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input" /></Field>
              <Field label="Catégorie"><input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input" /></Field>
              <Field label="Référence"><input value={editing.ref} onChange={(e) => setEditing({ ...editing, ref: e.target.value })} className="input" /></Field>
              <Field label="Code-barres"><input value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} className="input" /></Field>
              <Field label="Prix d'achat (FCFA)"><input type="number" value={editing.buyPrice} onChange={(e) => setEditing({ ...editing, buyPrice: +e.target.value })} className="input" /></Field>
              <Field label="Prix de vente (FCFA)"><input type="number" value={editing.sellPrice} onChange={(e) => setEditing({ ...editing, sellPrice: +e.target.value })} className="input" /></Field>
              <Field label="Seuil d'alerte"><input type="number" value={editing.threshold} onChange={(e) => setEditing({ ...editing, threshold: +e.target.value })} className="input" /></Field>
              <Field label="Date d'expiration"><input type="date" value={editing.expiry.slice(0, 10)} onChange={(e) => setEditing({ ...editing, expiry: new Date(e.target.value).toISOString() })} className="input" /></Field>
              <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                {Object.keys(editing.stockByStore).map((k) => (
                  <Field key={k} label={`Stock ${k}`}>
                    <input type="number" value={editing.stockByStore[k]}
                      onChange={(e) => setEditing({ ...editing, stockByStore: { ...editing.stockByStore, [k]: +e.target.value } })}
                      className="input" />
                  </Field>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={close} className="px-4 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">Enregistrer</button>
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
