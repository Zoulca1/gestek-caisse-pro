import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface CloudAuthValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const CloudAuthContext = createContext<CloudAuthValue | null>(null);

export function CloudAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentUserId: string | null = null;

    // 1. Listener FIRST — but ignore events that don't change the user
    // (TOKEN_REFRESHED on tab focus would otherwise trigger a full app re-render)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      const newUserId = newSession?.user?.id ?? null;
      if (event === "TOKEN_REFRESHED" && newUserId === currentUserId) {
        // Same user, just a token refresh — do not re-trigger downstream effects
        return;
      }
      currentUserId = newUserId;
      setSession(newSession);
      setLoading(false);
    });

    // 2. THEN getSession
    supabase.auth.getSession().then(({ data }) => {
      currentUserId = data.session?.user?.id ?? null;
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <CloudAuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </CloudAuthContext.Provider>
  );
}

export function useCloudAuth() {
  const ctx = useContext(CloudAuthContext);
  if (!ctx) throw new Error("useCloudAuth must be used within CloudAuthProvider");
  return ctx;
}
