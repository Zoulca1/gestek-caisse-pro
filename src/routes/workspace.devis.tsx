import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/devis")({
  component: () => <ComingSoon title="Devis" description="Créez des devis professionnels et convertissez-les en factures." />,
});
