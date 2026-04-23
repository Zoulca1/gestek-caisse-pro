import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCloudAuth } from "@/lib/cloud-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Sparkles, Building2, Settings, Rocket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: AppHomePage,
  head: () => ({ meta: [{ title: "Mon espace · GESTEK" }] }),
});

interface TenantSummary {
  id: string;
  name: string;
  activity_type: string;
  plan: string;
  trial_ends_at: string | null;
  onboarded: boolean;
}

function AppHomePage() {
  const { user, loading: authLoading, signOut } = useCloudAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  // Load user's tenants
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, activity_type, plan, trial_ends_at, onboarded")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setTenants(data as TenantSummary[]);
      setLoading(false);
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("À bientôt !");
    navigate({ to: "/" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const hasTenants = tenants && tenants.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-display font-bold">G</div>
            <div className="font-display font-bold">GESTEK</div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-muted-foreground">
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 hover:bg-muted transition"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {!hasTenants ? (
          <EmptyState />
        ) : (
          <TenantList tenants={tenants!} />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
        <Sparkles className="h-3 w-3" /> Bienvenue sur GESTEK
      </div>
      <h1 className="font-display font-bold text-3xl md:text-4xl">Créons votre première entreprise</h1>
      <p className="mt-4 text-muted-foreground">
        En 3 étapes, on configure votre espace GESTEK selon votre activité et les modules dont vous avez besoin.
      </p>

      <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
        <Step n={1} icon={Building2} title="Votre entreprise" desc="Nom, adresse, contact" />
        <Step n={2} icon={Sparkles} title="Type d'activité" desc="Pharmacie, boutique, etc." />
        <Step n={3} icon={Settings} title="Vos modules" desc="Caisse, stock, employés..." />
      </div>

      <Link
        to="/onboarding"
        className="mt-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition shadow-lg"
      >
        <Rocket className="h-4 w-4" /> Démarrer la configuration
      </Link>
      <p className="mt-3 text-xs text-muted-foreground">
        Cela ne prend que 2 minutes.
      </p>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center">{n}</span>
        Étape {n}
      </div>
      <Icon className="h-6 w-6 text-foreground mt-3" />
      <div className="mt-2 font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}

function TenantList({ tenants }: { tenants: TenantSummary[] }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Mes entreprises</h1>
          <p className="text-sm text-muted-foreground">Sélectionnez une entreprise pour y accéder.</p>
        </div>
      </div>
      <div className="space-y-3">
        {tenants.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{t.activity_type.replace("_", " ")} · Plan {t.plan}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {t.onboarded ? "Configuré" : "À configurer"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
