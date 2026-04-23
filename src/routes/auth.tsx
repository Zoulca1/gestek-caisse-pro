import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudAuth } from "@/lib/cloud-auth";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";

type AuthSearch = { mode?: "login" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search): AuthSearch => ({
    mode: search.mode === "signup" ? "signup" : "login",
  }),
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Connexion · GESTEK" }],
  }),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useCloudAuth();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect logged-in users
  if (!authLoading && user) {
    setTimeout(() => navigate({ to: "/app" }), 0);
  }

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie !");
        navigate({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? "Erreur Google");
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Entrez d'abord votre email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de réinitialisation envoyé !");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>

        <div className="rounded-2xl border border-border bg-card shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-display font-bold">G</div>
            <div>
              <div className="font-display font-bold text-xl">GESTEK</div>
              <div className="text-xs text-muted-foreground">Gestion modulaire pour PME</div>
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl">
            {mode === "signup" ? "Créer mon compte" : "Bon retour !"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "14 jours d'essai gratuit, sans carte bancaire." : "Connectez-vous à votre espace GESTEK."}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom complet</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Konan Yao" autoComplete="name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com" autoComplete="email"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mot de passe</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {mode === "login" && (
              <button type="button" onClick={handleForgot} className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-primary font-medium hover:underline">
              {mode === "signup" ? "Connexion" : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
