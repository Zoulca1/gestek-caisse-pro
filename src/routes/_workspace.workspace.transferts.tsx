import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/_workspace/workspace/transferts")({
  component: () => <ComingSoon title="Transferts" description="Transférez du stock entre vos magasins." />,
});
