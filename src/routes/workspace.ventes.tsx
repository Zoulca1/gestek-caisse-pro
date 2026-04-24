import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/ventes")({
  component: () => <ComingSoon title="Ventes" description="Encaissez vos ventes en quelques clics, avec gestion automatique du stock." />,
});
