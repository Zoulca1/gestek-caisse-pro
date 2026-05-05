import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/devis")({
  beforeLoad: () => { throw redirect({ to: "/workspace/devis" }); },
});
