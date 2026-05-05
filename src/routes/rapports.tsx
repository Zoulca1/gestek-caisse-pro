import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rapports")({
  beforeLoad: () => { throw redirect({ to: "/workspace/rapports" }); },
});
