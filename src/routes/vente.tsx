import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vente")({
  beforeLoad: () => { throw redirect({ to: "/workspace/ventes" }); },
});
