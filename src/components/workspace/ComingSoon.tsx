import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <Construction className="h-6 w-6" />
      </div>
      <h1 className="font-display font-bold text-2xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p className="mt-6 text-xs text-muted-foreground">
        Ce module est activé pour votre entreprise. La gestion complète arrive très bientôt.
      </p>
    </div>
  );
}
