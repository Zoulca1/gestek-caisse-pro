import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant, type ModuleKey } from "@/lib/tenant";
import { Loader2, Building2, Settings as Cog, Mail, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { useCloudAuth } from "@/lib/cloud-auth";

export const Route = createFileRoute("/workspace/parametres")({
  component: SettingsCloud,
});

const ALL_MODULES: { key: ModuleKey; label: string }[] = [
  { key: "ventes", label: "Ventes / Caisse" },
  { key: "stock", label: "Stock & Produits" },
  { key: "clients", label: "Clients" },
  { key: "fournisseurs", label: "Fournisseurs" },
  { key: "employes", label: "Employés" },
  { key: "comptabilite", label: "Comptabilité" },
  { key: "rapports", label: "Rapports" },
  { key: "devis", label: "Devis" },
  { key: "transferts", label: "Transferts" },
];

interface Invitation { id: string; email: string; role: string; created_at: string; accepted_at: string | null; expires_at: string }

function SettingsCloud() {
  const { tenant, isAdmin, modules, refresh } = useTenant();
  const { user } = useCloudAuth();
  const [name, setName] = useState(tenant?.name || "");
  const [currency, setCurrency] = useState(tenant?.currency || "XOF");
  const [country, setCountry] = useState(tenant?.country || "CI");
  const [saving, setSaving] = useState(false);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "vendeur" | "comptable">("vendeur");

  useEffect(() => {
    if (tenant) { setName(tenant.name); setCurrency(tenant.currency); setCountry(tenant.country || "CI"); }
  }, [tenant]);

  const loadInvites = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("tenant_invitations").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
    setInvites((data || []) as Invitation[]);
  };
  useEffect(() => { loadInvites(); }, [tenant]);

  if (!tenant) return null;

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("tenants").update({ name: name.trim(), currency, country }).eq("id", tenant.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Paramètres enregistrés"); refresh(); }
  };

  const toggleModule = async (key: ModuleKey, enabled: boolean) => {
    const { error } = await supabase.from("tenant_modules").upsert({
      tenant_id: tenant.id, module: key, enabled,
    }, { onConflict: "tenant_id,module" });
    if (error) toast.error(error.message);
    else { toast.success(`Module ${enabled ? "activé" : "désactivé"}`); refresh(); }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user) return;
    const { error } = await supabase.from("tenant_invitations").insert({
      tenant_id: tenant.id, email: inviteEmail.trim().toLowerCase(),
      role: inviteRole, invited_by: user.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Invitation créée"); setInviteEmail(""); loadInvites(); }
  };

  const removeInvite = async (id: string) => {
    if (!confirm("Supprimer cette invitation ?")) return;
    const { error } = await supabase.from("tenant_invitations").delete().eq("id", id);
    if (error) toast.error(error.message); else loadInvites();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre entreprise, vos modules et votre équipe.</p>
      </div>

      {/* Company info */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-display font-bold text-lg">Entreprise</h2></div>
        <form onSubmit={saveInfo} className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Nom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Devise</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!isAdmin} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50">
                <option value="XOF">FCFA (XOF)</option>
                <option value="XAF">FCFA (XAF)</option>
                <option value="EUR">Euro</option>
                <option value="USD">Dollar US</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Pays</span>
              <input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!isAdmin} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50" />
            </label>
          </div>
          <div className="text-xs text-muted-foreground">
            Plan actuel : <strong className="capitalize text-foreground">{tenant.plan}</strong>
            {tenant.trial_ends_at && tenant.plan === "trial" && <> · Essai jusqu'au {new Date(tenant.trial_ends_at).toLocaleDateString("fr-FR")}</>}
          </div>
          {isAdmin && (
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Enregistrer"}
            </button>
          )}
        </form>
      </section>

      {/* Modules */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Cog className="h-5 w-5 text-primary" /><h2 className="font-display font-bold text-lg">Modules activés</h2></div>
        <div className="grid sm:grid-cols-2 gap-2">
          {ALL_MODULES.map((m) => {
            const enabled = modules.has(m.key);
            return (
              <label key={m.key} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
                <span className="text-sm font-medium">{m.label}</span>
                <input type="checkbox" checked={enabled} disabled={!isAdmin} onChange={(e) => toggleModule(m.key, e.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
            );
          })}
        </div>
      </section>

      {/* Team */}
      {isAdmin && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Mail className="h-5 w-5 text-primary" /><h2 className="font-display font-bold text-lg">Inviter un collaborateur</h2></div>
          <form onSubmit={sendInvite} className="flex flex-wrap gap-2">
            <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemple.com" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
              <option value="vendeur">Vendeur</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
            <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              <Send className="h-4 w-4" /> Inviter
            </button>
          </form>

          {invites.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Invitations</div>
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.email}</div>
                    <div className="text-xs text-muted-foreground">{i.role} · {i.accepted_at ? "✓ Acceptée" : `Expire le ${new Date(i.expires_at).toLocaleDateString("fr-FR")}`}</div>
                  </div>
                  <button onClick={() => removeInvite(i.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
