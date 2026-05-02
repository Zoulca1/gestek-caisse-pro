import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCloudAuth } from "@/lib/cloud-auth";
import { useTenant } from "@/lib/tenant";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITY_PRESETS, ALL_MODULES, getPreset, type ActivityType, type ModuleKey } from "@/lib/activity-presets";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Loader2, Sparkles, Rocket,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Configuration · GESTEK" }] }),
});

type Step = 1 | 2 | 3 | 4;

function OnboardingPage() {
  const { user, loading: authLoading } = useCloudAuth();
  const { setActiveTenant } = useTenant();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("CI");
  const [currency, setCurrency] = useState("XOF");

  // Step 2
  const [activity, setActivity] = useState<ActivityType>("boutique_generale");

  // Step 3
  const [modules, setModules] = useState<Set<ModuleKey>>(
    new Set(getPreset("boutique_generale").defaultModules)
  );

  // Step 4 (created tenant id)
  const [createdTenantName, setCreatedTenantName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  // Update preset modules when activity changes
  const selectActivity = (a: ActivityType) => {
    setActivity(a);
    setModules(new Set(getPreset(a).defaultModules));
  };

  const toggleModule = (m: ModuleKey) => {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      // 0. Verify session is hydrated and JWT is attached
      const { data: { session }, error: sErr } = await supabase.auth.getSession();
      if (sErr) throw sErr;
      if (!session?.user) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        navigate({ to: "/auth" });
        return;
      }
      // Atomic creation via SECURITY DEFINER RPC (handles tenant + role + membership + modules in 1 transaction)
      const slug = companyName.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);

      const { data: tenantId, error: rpcErr } = await supabase.rpc("create_tenant_with_owner", {
        _name: companyName.trim(),
        _slug: slug,
        _activity: activity,
        _country: country,
        _currency: currency,
        _modules: Array.from(modules),
      });
      if (rpcErr) throw rpcErr;
      if (!tenantId) throw new Error("Création échouée");

      setCreatedTenantName(companyName.trim());
      setActiveTenant(tenantId as string);
      setStep(4);
      toast.success("Entreprise créée !");
    } catch (err: any) {
      console.error("[onboarding] create tenant failed:", err);
      const msg = err?.message ?? "";
      if (err?.code === "42501" || /row-level security|violates/i.test(msg)) {
        toast.error("Session expirée ou accès refusé. Reconnectez-vous puis réessayez.");
      } else {
        toast.error(msg || "Erreur lors de la création de l'entreprise");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-display font-bold">G</div>
            <div className="font-display font-bold">GESTEK</div>
          </Link>
          <div className="text-sm text-muted-foreground hidden sm:block">{user?.email}</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {step !== 4 && <Stepper current={step} />}

        <div className="mt-8">
          {step === 1 && (
            <StepCompany
              companyName={companyName} setCompanyName={setCompanyName}
              country={country} setCountry={setCountry}
              currency={currency} setCurrency={setCurrency}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepActivity
              activity={activity} onSelect={selectActivity}
              onBack={() => setStep(1)} onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepModules
              activity={activity} modules={modules} onToggle={toggleModule}
              onBack={() => setStep(2)} onSubmit={handleCreate} submitting={submitting}
            />
          )}
          {step === 4 && (
            <StepDone
              companyName={createdTenantName}
              activity={activity}
              modules={modules}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Entreprise" },
    { n: 2, label: "Activité" },
    { n: 3, label: "Modules" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-bold transition ${
              current >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {current > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${current >= s.n ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className={`h-px w-8 sm:w-16 ${current > s.n ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
      <h1 className="font-display font-bold text-2xl">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StepCompany({ companyName, setCompanyName, country, setCountry, currency, setCurrency, onNext }: any) {
  const canNext = companyName.trim().length >= 2;
  return (
    <Card title="Votre entreprise" subtitle="Quelques infos pour personnaliser GESTEK.">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nom de l'entreprise *</label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex : Pharmacie du Plateau"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pays</label>
            <select
              value={country} onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="CI">🇨🇮 Côte d'Ivoire</option>
              <option value="SN">🇸🇳 Sénégal</option>
              <option value="BF">🇧🇫 Burkina Faso</option>
              <option value="ML">🇲🇱 Mali</option>
              <option value="TG">🇹🇬 Togo</option>
              <option value="BJ">🇧🇯 Bénin</option>
              <option value="CM">🇨🇲 Cameroun</option>
              <option value="OTHER">🌍 Autre</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Devise</label>
            <select
              value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="XOF">FCFA (XOF)</option>
              <option value="XAF">FCFA (XAF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext} disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          Suivant <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function StepActivity({ activity, onSelect, onBack, onNext }: any) {
  return (
    <Card title="Quel est votre type d'activité ?" subtitle="Nous adapterons GESTEK à votre métier.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIVITY_PRESETS.map((p) => {
          const selected = activity === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`text-left rounded-xl border p-4 transition ${
                selected ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-3xl">{p.emoji}</div>
              <div className="mt-2 font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
              {selected && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Sélectionné
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition"
        >
          Suivant <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function StepModules({ activity, modules, onToggle, onBack, onSubmit, submitting }: any) {
  const preset = getPreset(activity);
  return (
    <Card
      title="Choisissez vos modules"
      subtitle={`Pré-sélection pour ${preset.emoji} ${preset.name}. Vous pouvez modifier à tout moment.`}
    >
      <div className="space-y-2">
        {ALL_MODULES.map((m) => {
          const enabled = modules.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => onToggle(m.key)}
              className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                enabled ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-2xl">{m.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
              </div>
              <div className={`h-6 w-6 rounded-md border-2 grid place-items-center transition ${
                enabled ? "border-primary bg-primary" : "border-border bg-background"
              }`}>
                {enabled && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        {modules.size} module{modules.size > 1 ? "s" : ""} sélectionné{modules.size > 1 ? "s" : ""}
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} disabled={submitting} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <button
          onClick={onSubmit} disabled={submitting || modules.size === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon entreprise <Rocket className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function StepDone({ companyName, activity, modules }: { companyName: string; activity: ActivityType; modules: Set<ModuleKey> }) {
  const preset = getPreset(activity);
  const enabled = ALL_MODULES.filter((m) => modules.has(m.key));

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-4 font-display font-bold text-3xl">Configuration terminée !</h1>
      <p className="mt-2 text-muted-foreground">
        <strong className="text-foreground">{companyName}</strong> est prêt à utiliser GESTEK.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
        <div className="rounded-xl border border-border p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase">Activité</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl">{preset.emoji}</span>
            <span className="font-semibold">{preset.name}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase">Modules activés</div>
          <div className="mt-2 font-semibold">{enabled.length} modules</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border p-5 text-left">
        <div className="text-xs font-medium text-muted-foreground uppercase mb-3">Vos modules</div>
        <div className="flex flex-wrap gap-2">
          {enabled.map((m) => (
            <span key={m.key} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <span>{m.emoji}</span> {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/workspace/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition"
        >
          <Sparkles className="h-4 w-4" /> Accéder à mon espace
        </Link>
        <Link
          to="/app"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted transition"
        >
          Mes entreprises
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Votre espace est prêt avec {modules.size} module{modules.size > 1 ? "s" : ""} actif{modules.size > 1 ? "s" : ""}.
      </p>
    </div>
  );
}
