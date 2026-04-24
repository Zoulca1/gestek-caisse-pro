import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/comptabilite")({
  component: () => <ComingSoon title="Comptabilité" description="Suivez recettes, dépenses et trésorerie." />,
});
