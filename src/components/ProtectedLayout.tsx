import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "./AppLayout";

export function ProtectedLayout({ children, require }: { children: React.ReactNode; require?: "ventes" | "stock" | "admin" }) {
  const { user, ready, can } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/" });
    else if (require && !can(require)) navigate({ to: "/dashboard" });
  }, [ready, user, require]);

  if (!ready || !user) return null;
  return <AppLayout>{children}</AppLayout>;
}
