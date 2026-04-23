import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, ShoppingCart, BarChart3, Users2, Boxes, FileText,
  Calculator, ShieldCheck, Wifi, Zap, ArrowRight, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "GESTEK · Logiciel de gestion pour PME africaines" },
      { name: "description", content: "GESTEK : caisse, stock, comptabilité, employés. Une solution modulaire qui s'adapte à votre activité — pharmacie, restaurant, boutique, quincaillerie." },
    ],
  }),
});

const FEATURES = [
  { icon: ShoppingCart, title: "Caisse rapide", desc: "Encaissez en quelques secondes, multi-paiement (Espèces, Mobile Money, Crédit)." },
  { icon: Boxes, title: "Stock multi-magasins", desc: "Suivi en temps réel, alertes ruptures, transferts entre points de vente." },
  { icon: Users2, title: "Clients & Employés", desc: "Fichier client, crédits, salaires, congés, bulletins PDF." },
  { icon: Calculator, title: "Comptabilité simple", desc: "Dépenses, dettes fournisseurs, clôture de caisse, rapports mensuels." },
  { icon: FileText, title: "Devis professionnels", desc: "Créez et envoyez vos devis en PDF, conversion en facture." },
  { icon: BarChart3, title: "Tableaux de bord", desc: "KPIs en direct adaptés à votre métier : marge, top produits, performance." },
];

const ACTIVITIES = [
  { emoji: "💊", name: "Pharmacie", desc: "Suivi DLC, ordonnances, garde" },
  { emoji: "🍽️", name: "Restaurant", desc: "Tables, menus, ingrédients" },
  { emoji: "🛒", name: "Boutique générale", desc: "Multi-rayons, polyvalent" },
  { emoji: "🔧", name: "Quincaillerie", desc: "Références techniques, lots" },
  { emoji: "💄", name: "Cosmétique", desc: "Lots, péremption, marques" },
  { emoji: "🥘", name: "Alimentaire", desc: "Frais, surgelés, traçabilité" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-display font-bold">G</div>
            <div className="font-display font-bold text-xl">GESTEK</div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Fonctionnalités</a>
            <a href="#activities" className="text-muted-foreground hover:text-foreground transition">Activités</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm font-medium text-foreground hover:text-primary transition px-3 py-2">
              Connexion
            </Link>
            <Link to="/auth" search={{ mode: "signup" }} className="text-sm font-semibold rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3 w-3" /> Nouveau · 14 jours d'essai gratuit
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight tracking-tight">
              Le logiciel de gestion qui <span className="text-primary">s'adapte</span> à votre commerce
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Caisse, stock, employés, comptabilité — choisissez les modules dont vous avez besoin. Conçu pour les PME en Côte d'Ivoire et en Afrique de l'Ouest.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition shadow-lg">
                Créer mon compte gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-semibold hover:bg-muted transition">
                Voir la démo en direct
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sans carte bancaire</div>
              <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Fonctionne hors-ligne</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Setup en 2 minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl">Tout ce qu'il faut pour gérer votre PME</h2>
            <p className="mt-4 text-muted-foreground">Un logiciel modulaire : activez seulement ce dont vous avez besoin.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVITIES */}
      <section id="activities" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl">Adapté à votre secteur</h2>
            <p className="mt-4 text-muted-foreground">À l'inscription, GESTEK configure votre dashboard selon votre activité.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ACTIVITIES.map((a) => (
              <div key={a.name} className="rounded-xl border border-border bg-card p-5 text-center hover:border-primary transition">
                <div className="text-4xl mb-2">{a.emoji}</div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl">Tarifs simples, sans surprise</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">À partir de <strong className="text-foreground">15 000 FCFA / mois</strong>. 14 jours d'essai gratuit, sans engagement.</p>
          <div className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3 font-semibold hover:bg-primary/90 transition shadow-lg">
              Démarrer mon essai <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> © {new Date().getFullYear()} GESTEK · Abidjan, Côte d'Ivoire
          </div>
          <div className="flex items-center gap-6">
            <Link to="/demo" className="hover:text-foreground transition">Démo</Link>
            <Link to="/auth" className="hover:text-foreground transition">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
