import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Trash2, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/fournisseurs")({
  component: SuppliersCloud,
});

interface Supplier {
  id: string; name: string; contact_name: string | null; phone: string | null;
  email: string | null; city: string | null; address: string | null; payment_terms: string | null;
}

function SuppliersCloud() {
  const { tenant, isAdmin } = useTenant();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").eq("tenant_id", tenant.id).order("name");
    if (error) toast.error(error.message); else setItems((data || []) as Supplier[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  const filtered = items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground">{items.length} fournisseur{items.length > 1 ? "s" : ""}.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nouveau fournisseur
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {items.length === 0 ? "Aucun fournisseur." : "Aucun résultat."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Nom</th>
                <th className="text-left px-4 py-2.5">Contact</th>
                <th className="text-left px-4 py-2.5">Téléphone</th>
                <th className="text-left px-4 py-2.5">Conditions</th>
                {isAdmin && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.contact_name || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.payment_terms || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(c.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && tenant && (
        <SupplierForm tenantId={tenant.id} initial={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function SupplierForm({ tenantId, initial, onClose, onSaved }: { tenantId: string; initial: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [contact, setContact] = useState(initial?.contact_name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [city, setCity] = useState(initial?.city || "");
  const [terms, setTerms] = useState(initial?.payment_terms || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nom obligatoire");
    setSaving(true);
    const payload = {
      name: name.trim(), contact_name: contact.trim() || null, phone: phone.trim() || null,
      email: email.trim() || null, city: city.trim() || null, payment_terms: terms.trim() || null,
    };
    const { error } = initial
      ? await supabase.from("suppliers").update(payload).eq("id", initial.id)
      : await supabase.from("suppliers").insert({ ...payload, tenant_id: tenantId });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Mis à jour" : "Créé"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-md p-5 space-y-3 border border-border">
        <h2 className="font-display font-bold text-lg">{initial ? "Modifier" : "Nouveau"} fournisseur</h2>
        <Field label="Nom *" value={name} onChange={setName} />
        <Field label="Personne contact" value={contact} onChange={setContact} />
        <Field label="Téléphone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Ville" value={city} onChange={setCity} />
        <Field label="Conditions de paiement" value={terms} onChange={setTerms} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : initial ? "Mettre à jour" : "Créer"}
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
