import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/transferts")({
  beforeLoad: () => { throw redirect({ to: "/workspace/transferts" }); },
});
