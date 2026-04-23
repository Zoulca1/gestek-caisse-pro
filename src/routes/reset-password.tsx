import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe · GESTEK" }] }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash when user lands here
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour !");
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="rounded-2xl border border-border bg-card shadow-xl p-8">
          <h1 className="font-display font-bold text-2xl">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mt-1">Choisissez un mot de passe sécurisé d'au moins 6 caractères.</p>

          {validSession === false && (
            <div className="mt-6 rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
              Lien invalide ou expiré. Demandez un nouveau lien depuis la page de connexion.
            </div>
          )}

          {validSession && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nouveau mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Confirmer</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Mettre à jour
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
