import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/produits")({
  beforeLoad: () => { throw redirect({ to: "/workspace/produits" }); },
});
