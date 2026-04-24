import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/entrees")({
  component: () => <ComingSoon title="Entrées de stock" description="Réceptionnez vos commandes fournisseurs." />,
});
