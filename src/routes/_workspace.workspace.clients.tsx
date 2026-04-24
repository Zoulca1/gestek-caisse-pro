import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/workspace/ComingSoon";

export const Route = createFileRoute("/_workspace/workspace/clients")({
  component: () => <ComingSoon title="Clients" description="Gérez votre base clients et leur fidélité." />,
});
