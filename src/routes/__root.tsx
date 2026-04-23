import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CloudAuthProvider } from "@/lib/cloud-auth";
import { ThemeProvider } from "@/lib/theme";
import { DataProvider } from "@/lib/store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Épicerie Moderne KOFFI · Gestion par GESTEK" },
      { name: "description", content: "Application de gestion de stock et caisse pour épicerie en Côte d'Ivoire — démo GESTEK." },
      { property: "og:title", content: "Épicerie Moderne KOFFI · Gestion par GESTEK" },
      { name: "twitter:title", content: "Épicerie Moderne KOFFI · Gestion par GESTEK" },
      { property: "og:description", content: "Application de gestion de stock et caisse pour épicerie en Côte d'Ivoire — démo GESTEK." },
      { name: "twitter:description", content: "Application de gestion de stock et caisse pour épicerie en Côte d'Ivoire — démo GESTEK." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9ab0e9da-a194-4a5a-be85-a97553fc39b7/id-preview-486f37d2--fc38cf2e-1595-4398-9282-86978d386088.lovable.app-1776615483824.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9ab0e9da-a194-4a5a-be85-a97553fc39b7/id-preview-486f37d2--fc38cf2e-1595-4398-9282-86978d386088.lovable.app-1776615483824.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <CloudAuthProvider>
        <AuthProvider>
          <DataProvider>
            <Outlet />
            <Toaster richColors position="top-right" />
          </DataProvider>
        </AuthProvider>
      </CloudAuthProvider>
    </ThemeProvider>
  );
}
