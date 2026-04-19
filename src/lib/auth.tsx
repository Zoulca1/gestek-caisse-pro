import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

const ACCOUNTS: Record<string, { password: string; role: Role; name: string }> = {
  admin:   { password: "admin123", role: "admin",   name: "Konan Admin" },
  vendeur: { password: "vente123", role: "vendeur", name: "Aya Vendeuse" },
  stock:   { password: "stock123", role: "stock",   name: "Brou Stock" },
};

const KEY = "koffi-auth-v1";

interface AuthValue {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  ready: boolean;
  can: (section: "ventes" | "stock" | "admin") => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = (username: string, password: string) => {
    const acc = ACCOUNTS[username.toLowerCase().trim()];
    if (!acc || acc.password !== password) return false;
    const u: User = { username: username.toLowerCase().trim(), role: acc.role, name: acc.name };
    setUser(u);
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch {}
    return true;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch {}
  };

  const can = (section: "ventes" | "stock" | "admin") => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (section === "ventes") return user.role === "vendeur";
    if (section === "stock") return user.role === "stock";
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
