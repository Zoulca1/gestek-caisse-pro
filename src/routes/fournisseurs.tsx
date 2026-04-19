import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa } from "@/lib/format";

export const Route = createFileRoute("/fournisseurs")({
  component: () => <ProtectedLayout><FournisseursPage /></ProtectedLayout>,
});

function FournisseursPage() {
  const { suppliers } = useData();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Fournisseurs</h1>
        <p className="text-sm text-muted-foreground">{suppliers.length} fournisseurs partenaires.</p>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Nom</th><th className="px-3 py-2.5">Téléphone</th>
              <th className="px-3 py-2.5">Spécialité</th>
              <th className="px-3 py-2.5 text-right">Commandes</th>
              <th className="px-3 py-2.5 text-right">Total acheté</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{s.phone}</td>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{s.specialty}</span></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{s.ordersCount}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(s.totalBought)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
