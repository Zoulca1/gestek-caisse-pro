import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { useState, useEffect } from "react";
import { Save, Download, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/parametres")({
  component: () => <ProtectedLayout require="admin"><ParamsPage /></ProtectedLayout>,
});

function ParamsPage() {
  const { company, setCompany, exportJSON, resetAll } = useData();
  const [form, setForm] = useState(company);
  useEffect(() => setForm(company), [company]);

  const save = () => { setCompany(form); toast.success("Paramètres enregistrés"); };

  const download = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sauvegarde-koffi.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Sauvegarde exportée");
  };

  const reset = () => {
    if (!confirm("Cette action efface toutes les données et recharge les exemples. Continuer ?")) return;
    resetAll(); toast.success("Données réinitialisées");
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration de l'épicerie et sauvegarde.</p>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border space-y-3">
        <h2 className="font-display font-bold">Informations entreprise</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nom"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
          <Field label="Téléphone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
          <Field label="Adresse"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" /></Field>
          <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></Field>
          <Field label="RCCM"><input value={form.rccm} onChange={(e) => setForm({ ...form, rccm: e.target.value })} className="input" /></Field>
          <Field label="Compte contribuable"><input value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })} className="input" /></Field>
          <Field label="Objectif mensuel CA (FCFA)">
            <input type="number" value={form.monthlyGoal || 0}
              onChange={(e) => setForm({ ...form, monthlyGoal: +e.target.value })} className="input" />
          </Field>
        </div>
        <div className="flex justify-end">
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border">
        <h2 className="font-display font-bold mb-2">Sauvegarde des données</h2>
        <p className="text-sm text-muted-foreground mb-3">Exportez l'ensemble de vos données au format JSON pour archivage ou transfert.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={download} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-semibold">
            <Download className="h-4 w-4" /> Exporter (JSON)
          </button>
          <button onClick={reset} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive text-destructive text-sm font-semibold hover:bg-destructive/10">
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </button>
        </div>
      </div>

      <div className="p-5 rounded-xl border-2 border-primary/40 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-primary">Garanties GESTEK</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          <li className="flex gap-2"><span className="text-primary">✓</span> Sans abonnement mensuel</li>
          <li className="flex gap-2"><span className="text-primary">✓</span> Sans connexion internet permanente</li>
          <li className="flex gap-2"><span className="text-primary">✓</span> Licence à vie</li>
          <li className="flex gap-2"><span className="text-primary">✓</span> Support WhatsApp illimité</li>
          <li className="flex gap-2"><span className="text-primary">✓</span> Multi-appareils</li>
          <li className="flex gap-2"><span className="text-primary">✓</span> Sur mesure pour votre activité</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Contactez GESTEK pour une démo personnalisée et un devis adapté à votre PME.</p>
      </div>

      <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span><div className="mt-1">{children}</div></label>;
}
