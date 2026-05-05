import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/comptabilite")({
  beforeLoad: () => { throw redirect({ to: "/workspace/comptabilite" }); },
});
