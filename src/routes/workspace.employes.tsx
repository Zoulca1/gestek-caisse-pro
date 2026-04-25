import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Trash2, Pencil, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/employes")({
  component: EmployeesCloud,
});

interface Employee {
  id: string; full_name: string; position: string | null; phone: string | null;
  email: string | null; salary: number | null; hired_at: string | null; active: boolean;
}

function EmployeesCloud() {
  const { tenant, isAdmin } = useTenant();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase.from("employees").select("*").eq("tenant_id", tenant.id).order("full_name");
    if (error) toast.error(error.message); else setItems((data || []) as Employee[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tenant]);

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet employé ?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  const toggleActive = async (e: Employee) => {
    const { error } = await supabase.from("employees").update({ active: !e.active }).eq("id", e.id);
    if (error) toast.error(error.message); else { toast.success(e.active ? "Désactivé" : "Activé"); load(); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: tenant?.currency || "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Employés</h1>
          <p className="text-sm text-muted-foreground">{items.length} employé{items.length > 1 ? "s" : ""}.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nouvel employé
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun employé. Ajoutez votre équipe.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Nom</th>
                <th className="text-left px-4 py-2.5">Poste</th>
                <th className="text-left px-4 py-2.5">Téléphone</th>
                <th className="text-right px-4 py-2.5">Salaire</th>
                <th className="text-left px-4 py-2.5">Statut</th>
                {isAdmin && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{e.full_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.position || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{e.phone || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{e.salary ? fmt(Number(e.salary)) : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {e.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => toggleActive(e)} className="p-1.5 rounded hover:bg-muted" title={e.active ? "Désactiver" : "Activer"}>
                          {e.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button onClick={() => { setEditing(e); setShowForm(true); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(e.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
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
        <EmployeeForm tenantId={tenant.id} initial={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function EmployeeForm({ tenantId, initial, onClose, onSaved }: { tenantId: string; initial: Employee | null; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [position, setPosition] = useState(initial?.position || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [salary, setSalary] = useState(initial?.salary?.toString() || "");
  const [hiredAt, setHiredAt] = useState(initial?.hired_at || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Nom obligatoire");
    setSaving(true);
    const payload = {
      full_name: fullName.trim(), position: position.trim() || null, phone: phone.trim() || null,
      email: email.trim() || null, salary: salary ? Number(salary) : 0, hired_at: hiredAt || null,
    };
    const { error } = initial
      ? await supabase.from("employees").update(payload).eq("id", initial.id)
      : await supabase.from("employees").insert({ ...payload, tenant_id: tenantId });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Mis à jour" : "Créé"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-xl w-full max-w-md p-5 space-y-3 border border-border">
        <h2 className="font-display font-bold text-lg">{initial ? "Modifier" : "Nouvel"} employé</h2>
        <Field label="Nom complet *" value={fullName} onChange={setFullName} />
        <Field label="Poste" value={position} onChange={setPosition} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone" value={phone} onChange={setPhone} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salaire" value={salary} onChange={setSalary} type="number" />
          <Field label="Date d'embauche" value={hiredAt} onChange={setHiredAt} type="date" />
        </div>
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
