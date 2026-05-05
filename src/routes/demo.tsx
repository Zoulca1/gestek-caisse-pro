import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Package, Shield, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Démo en direct — GESTEK" },
      { name: "description", content: "Testez GESTEK avec un compte démo pré-rempli (Épicerie KOFFI Abidjan). Aucune inscription, accès en 1 clic." },
      { property: "og:title", content: "Démo en direct — GESTEK" },
      { property: "og:description", content: "Testez GESTEK avec un compte démo pré-rempli. Aucune inscription, accès en 1 clic." },
    ],
  }),
  component: DemoPage,
});

const DEMO_ACCOUNTS = [
  {
    role: "owner",
    email: "demo-admin@gestek.app",
    password: "DemoAdmin2026!",
    label: "Propriétaire",
    desc: "Accès complet : ventes, stock, comptabilité, employés, paramètres.",
    icon: Shield,
    accent: "from-primary to-primary-glow",
  },
  {
    role: "vendeur",
    email: "demo-vendeur@gestek.app",
    password: "DemoVendeur2026!",
    label: "Vendeur / Caisse",
    desc: "Encaissement, devis, fiche client. Pas d'accès aux paramètres.",
    icon: ShoppingCart,
    accent: "from-emerald-500 to-emerald-400",
  },
  {
    role: "stock",
    email: "demo-stock@gestek.app",
    password: "DemoStock2026!",
    label: "Magasinier",
    desc: "Produits, entrées de stock, fournisseurs, transferts.",
    icon: Package,
    accent: "from-amber-500 to-amber-400",
  },
];

function DemoPage() {
  const navigate = useNavigate();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.functions.invoke("demo-setup");
        if (error) throw error;
        setBootstrapped(true);
      } catch (e: any) {
        toast.error("Préparation de la démo : " + (e?.message ?? "erreur"));
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    setSigningIn(email);
    try {
      // sign out current session if any to avoid stale tenant
      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion à la démo réussie");
      navigate({ to: "/workspace/dashboard" });
    } catch (e: any) {
      toast.error("Connexion : " + (e?.message ?? "erreur"));
      setSigningIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">G</div>
          <span className="font-display font-bold text-lg">GESTEK</span>
        </Link>
        <Link to="/auth" search={{ mode: "signup" }} className="text-sm font-medium hover:text-primary transition">
          Créer mon compte →
        </Link>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center mt-6 md:mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Démo en direct · Épicerie KOFFI Abidjan
          </div>
          <h1 className="mt-5 font-display font-bold text-3xl md:text-5xl leading-tight">
            Testez GESTEK avec des données réelles
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Choisissez un rôle et connectez-vous en 1 clic. Aucune inscription requise. La boutique de démo contient produits, clients, ventes et comptabilité.
          </p>
        </div>

        <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {DEMO_ACCOUNTS.map((a) => {
            const Icon = a.icon;
            const loading = signingIn === a.email;
            return (
              <div key={a.role} className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-2xl transition-all">
                <div className={`h-2 bg-gradient-to-r ${a.accent}`} />
                <div className="p-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.accent} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display font-bold text-xl">{a.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed min-h-[60px]">{a.desc}</p>

                  <button
                    onClick={() => signIn(a.email, a.password)}
                    disabled={!bootstrapped || loading || !!signingIn}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</>
                    ) : (
                      <>Se connecter <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>

                  <details className="mt-4 text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Identifiants manuels</summary>
                    <div className="mt-2 space-y-1 font-mono">
                      <div>{a.email}</div>
                      <div>{a.password}</div>
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>

        {bootstrapping && (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Préparation de la boutique de démonstration…
          </div>
        )}

        <div className="mt-14 max-w-2xl mx-auto text-center text-xs text-muted-foreground">
          Les comptes de démonstration sont partagés. Toute donnée que vous saisissez peut être visible des autres visiteurs et réinitialisée.
        </div>
      </main>
    </div>
  );
}
