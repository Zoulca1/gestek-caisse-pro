import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/workspace/rapports")({
  component: () => <ComingSoon title="Rapports" description="Analysez vos performances avec des rapports détaillés." />,
});
