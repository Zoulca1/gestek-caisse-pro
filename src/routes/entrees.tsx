import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/entrees")({
  beforeLoad: () => { throw redirect({ to: "/workspace/entrees" }); },
});
