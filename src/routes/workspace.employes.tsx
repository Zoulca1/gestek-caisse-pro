import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/employes")({
  component: () => <ComingSoon title="Employés" description="Gérez votre équipe, salaires et présences." />,
});
