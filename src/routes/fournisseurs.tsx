import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/fournisseurs")({
  beforeLoad: () => { throw redirect({ to: "/workspace/fournisseurs" }); },
});
