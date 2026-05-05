import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/employes")({
  beforeLoad: () => { throw redirect({ to: "/workspace/employes" }); },
});
