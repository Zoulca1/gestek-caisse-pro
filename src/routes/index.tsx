import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sprout, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    // already logged in
    setTimeout(() => navigate({ to: "/dashboard" }), 0);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success(`Bienvenue ${username} !`);
      navigate({ to: "/dashboard" });
    } else {
      toast.error("Identifiants incorrects");
    }
  };

  const fill = (u: string, p: string) => { setUsername(u); setPassword(p); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gold text-gold-foreground grid place-items-center font-display font-bold text-xl">G</div>
            <div className="font-display font-bold text-2xl">GESTEK</div>
          </div>
          <div className="mt-16 max-w-md">
            <h1 className="font-display font-bold text-4xl leading-tight">
              Logiciels sur mesure pour les <span className="text-gold">PME africaines</span>.
            </h1>
            <p className="mt-4 text-sidebar-foreground/70 leading-relaxed">
              Démo : gestion complète de l'<strong className="text-sidebar-foreground">Épicerie Moderne KOFFI</strong> à Abidjan — caisse, stock multi-magasins, clients & crédits.
            </p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-sidebar-accent/40"><Sprout className="h-4 w-4 text-gold mb-1" />Sans abonnement</div>
          <div className="p-3 rounded-lg bg-sidebar-accent/40"><ShieldCheck className="h-4 w-4 text-gold mb-1" />Licence à vie</div>
          <div className="p-3 rounded-lg bg-sidebar-accent/40"><span className="text-gold text-base">📞</span><div className="mt-0.5">Support WhatsApp</div></div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">G</div>
            <div className="font-display font-bold text-xl">GESTEK</div>
          </div>
          <h2 className="font-display font-bold text-2xl">Connexion</h2>
          <p className="text-sm text-muted-foreground mt-1">Accédez à la gestion de l'épicerie.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Identifiant</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin" autoFocus />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••" />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold hover:bg-primary-glow transition-colors">
              Se connecter
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Comptes de démonstration</div>
            <div className="space-y-2">
              {[
                { u: "admin", p: "admin123", label: "Admin · accès complet" },
                { u: "vendeur", p: "vente123", label: "Vendeur · ventes" },
                { u: "stock", p: "stock123", label: "Stock · gestion stock" },
              ].map((a) => (
                <button key={a.u} onClick={() => fill(a.u, a.p)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
                  <span><span className="font-mono font-semibold">{a.u}</span> / <span className="font-mono">{a.p}</span></span>
                  <span className="text-xs text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
