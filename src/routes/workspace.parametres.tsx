import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant, type ModuleKey } from "@/lib/tenant";
import { Loader2, Building2, Settings as Cog, Mail, Trash2, Send, Upload, Copy, FileText } from "lucide-react";
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

interface Invitation {
  id: string; email: string; role: string; token: string;
  created_at: string; accepted_at: string | null; expires_at: string;
}

interface CompanyForm {
  name: string;
  currency: string;
  country: string;
  logo_url: string;
  address: string;
  city: string;
  country_full: string;
  phone_company: string;
  email_company: string;
  website: string;
  tax_id: string;
  cc_number: string;
  bank_info: string;
  signature_url: string;
  invoice_footer: string;
  invoice_prefix: string;
}

const EMPTY: CompanyForm = {
  name: "", currency: "XOF", country: "CI",
  logo_url: "", address: "", city: "", country_full: "",
  phone_company: "", email_company: "", website: "",
  tax_id: "", cc_number: "", bank_info: "",
  signature_url: "", invoice_footer: "", invoice_prefix: "",
};

function SettingsCloud() {
  const { tenant, isAdmin, modules, refresh } = useTenant();
  const { user } = useCloudAuth();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "signature" | null>(null);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "vendeur" | "comptable">("vendeur");

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data } = await supabase.from("tenants").select("*").eq("id", tenant.id).maybeSingle();
      if (data) {
        const t = data as any;
        setForm({
          name: t.name || "",
          currency: t.currency || "XOF",
          country: t.country || "CI",
          logo_url: t.logo_url || "",
          address: t.address || "",
          city: t.city || "",
          country_full: t.country_full || "",
          phone_company: t.phone_company || "",
          email_company: t.email_company || "",
          website: t.website || "",
          tax_id: t.tax_id || "",
          cc_number: t.cc_number || "",
          bank_info: t.bank_info || "",
          signature_url: t.signature_url || "",
          invoice_footer: t.invoice_footer || "",
          invoice_prefix: t.invoice_prefix || "",
        });
      }
    })();
  }, [tenant]);

  const loadInvites = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("tenant_invitations").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
    setInvites((data || []) as Invitation[]);
  };
  useEffect(() => { loadInvites(); }, [tenant]);

  if (!tenant) return null;

  const upd = (patch: Partial<CompanyForm>) => setForm((f) => ({ ...f, ...patch }));

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      name: form.name.trim(),
      currency: form.currency,
      country: form.country,
      logo_url: form.logo_url || null,
      address: form.address || null,
      city: form.city || null,
      country_full: form.country_full || null,
      phone_company: form.phone_company || null,
      email_company: form.email_company || null,
      website: form.website || null,
      tax_id: form.tax_id || null,
      cc_number: form.cc_number || null,
      bank_info: form.bank_info || null,
      signature_url: form.signature_url || null,
      invoice_footer: form.invoice_footer || null,
      invoice_prefix: form.invoice_prefix || null,
    } as any).eq("id", tenant.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Paramètres enregistrés"); refresh(); }
  };

  const uploadFile = async (kind: "logo" | "signature", file: File) => {
    if (!tenant) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 4 Mo)");
      return;
    }
    setUploading(kind);
    const ext = file.name.split(".").pop() || "png";
    const path = `${tenant.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (error) { setUploading(null); toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("company-assets").getPublicUrl(path);
    if (kind === "logo") upd({ logo_url: pub.publicUrl });
    else upd({ signature_url: pub.publicUrl });
    setUploading(null);
    toast.success(`${kind === "logo" ? "Logo" : "Signature"} téléchargé`);
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
    else { toast.success("Invitation créée — copiez le lien pour l'envoyer"); setInviteEmail(""); loadInvites(); }
  };

  const removeInvite = async (id: string) => {
    if (!confirm("Supprimer cette invitation ?")) return;
    const { error } = await supabase.from("tenant_invitations").delete().eq("id", id);
    if (error) toast.error(error.message); else loadInvites();
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien d'invitation copié");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre entreprise, vos modules et votre équipe.</p>
      </div>

      {/* Company info */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-display font-bold text-lg">Identité de l'entreprise</h2></div>
        <form onSubmit={saveInfo} className="space-y-4">
          {/* Logo & signature */}
          <div className="grid sm:grid-cols-2 gap-3">
            <AssetField
              label="Logo"
              url={form.logo_url}
              uploading={uploading === "logo"}
              disabled={!isAdmin}
              onUpload={(f) => uploadFile("logo", f)}
              onClear={() => upd({ logo_url: "" })}
            />
            <AssetField
              label="Signature"
              url={form.signature_url}
              uploading={uploading === "signature"}
              disabled={!isAdmin}
              onUpload={(f) => uploadFile("signature", f)}
              onClear={() => upd({ signature_url: "" })}
            />
          </div>

          <Field label="Nom de l'entreprise" value={form.name} onChange={(v) => upd({ name: v })} disabled={!isAdmin} required />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.phone_company} onChange={(v) => upd({ phone_company: v })} disabled={!isAdmin} />
            <Field label="Email" type="email" value={form.email_company} onChange={(v) => upd({ email_company: v })} disabled={!isAdmin} />
          </div>

          <Field label="Site web" value={form.website} onChange={(v) => upd({ website: v })} disabled={!isAdmin} placeholder="https://..." />

          <Field label="Adresse" value={form.address} onChange={(v) => upd({ address: v })} disabled={!isAdmin} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Ville" value={form.city} onChange={(v) => upd({ city: v })} disabled={!isAdmin} />
            <Field label="Pays (libellé)" value={form.country_full} onChange={(v) => upd({ country_full: v })} disabled={!isAdmin} placeholder="ex. Côte d'Ivoire" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="RCCM / N° d'immatriculation" value={form.tax_id} onChange={(v) => upd({ tax_id: v })} disabled={!isAdmin} />
            <Field label="Compte contribuable (CC)" value={form.cc_number} onChange={(v) => upd({ cc_number: v })} disabled={!isAdmin} />
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Coordonnées bancaires</span>
            <textarea value={form.bank_info} onChange={(e) => upd({ bank_info: e.target.value })} disabled={!isAdmin} rows={2} placeholder="Banque, IBAN, RIB..." className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50" />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Devise</span>
              <select value={form.currency} onChange={(e) => upd({ currency: e.target.value })} disabled={!isAdmin} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50">
                <option value="XOF">FCFA (XOF)</option>
                <option value="XAF">FCFA (XAF)</option>
                <option value="EUR">Euro</option>
                <option value="USD">Dollar US</option>
              </select>
            </label>
            <Field label="Code pays" value={form.country} onChange={(v) => upd({ country: v })} disabled={!isAdmin} />
          </div>

          {/* Invoice config */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Personnalisation des factures</h3>
            </div>
            <Field label="Préfixe facture" value={form.invoice_prefix} onChange={(v) => upd({ invoice_prefix: v })} disabled={!isAdmin} placeholder="ex. FAC-2026-" />
            <label className="block mt-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Pied de page facture / mentions légales</span>
              <textarea value={form.invoice_footer} onChange={(e) => upd({ invoice_footer: e.target.value })} disabled={!isAdmin} rows={3} placeholder="Mentions légales, conditions de paiement..." className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50" />
            </label>
          </div>

          <div className="text-xs text-muted-foreground">
            Plan actuel : <strong className="capitalize text-foreground">{tenant.plan}</strong>
            {tenant.trial_ends_at && tenant.plan === "trial" && <> · Essai jusqu'au {new Date(tenant.trial_ends_at).toLocaleDateString("fr-FR")}</>}
          </div>
          {isAdmin && (
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
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
          <div className="flex items-center gap-2 mb-2"><Mail className="h-5 w-5 text-primary" /><h2 className="font-display font-bold text-lg">Inviter un collaborateur</h2></div>
          <p className="text-xs text-muted-foreground mb-4">
            Créez l'invitation puis copiez le lien à envoyer manuellement à votre collaborateur (par email, WhatsApp, etc.).
          </p>
          <form onSubmit={sendInvite} className="flex flex-wrap gap-2">
            <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemple.com" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
              <option value="vendeur">Vendeur</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
            <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              <Send className="h-4 w-4" /> Créer l'invitation
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
                  <div className="flex items-center gap-1">
                    {!i.accepted_at && (
                      <button type="button" onClick={() => copyInviteLink(i.token)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded">
                        <Copy className="h-3.5 w-3.5" /> Copier le lien
                      </button>
                    )}
                    <button onClick={() => removeInvite(i.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = "text", required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled} required={required} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50"
      />
    </label>
  );
}

function AssetField({ label, url, uploading, disabled, onUpload, onClear }: {
  label: string; url: string; uploading: boolean; disabled?: boolean;
  onUpload: (f: File) => void; onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{label}</div>
      {url ? (
        <div className="flex items-center gap-3">
          <img src={url} alt={label} className="h-16 w-16 object-contain rounded bg-muted" />
          {!disabled && (
            <button type="button" onClick={onClear} className="text-xs text-destructive hover:underline">Retirer</button>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground mb-2">Aucun fichier</div>
      )}
      {!disabled && (
        <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-semibold cursor-pointer hover:bg-muted">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {url ? "Remplacer" : "Téléverser"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }} />
        </label>
      )}
    </div>
  );
}
