import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/_workspace/workspace/fournisseurs")({
  component: () => <ComingSoon title="Fournisseurs" description="Gérez vos fournisseurs et conditions de paiement." />,
});
