import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa } from "@/lib/format";
import { useState } from "react";
import { MessageCircle, Wallet, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  component: () => <ProtectedLayout><ClientsPage /></ProtectedLayout>,
});

function ClientsPage() {
  const { clients, setClients } = useData();
  const [paying, setPaying] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);

  const sendReminder = (c: typeof clients[0]) => {
    const phone = c.phone.replace(/\D/g, "");
    const msg = `Bonjour ${c.name}, ceci est un rappel amical concernant votre crédit en cours de ${fcfa(c.credit)} chez l'Épicerie Moderne KOFFI. Merci de passer régler dès que possible. Cordialement.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const submitPayment = () => {
    const c = clients.find((x) => x.id === paying);
    if (!c) return;
    if (amount <= 0 || amount > c.credit) { toast.error("Montant invalide"); return; }
    setClients(clients.map((x) => x.id === c.id ? { ...x, credit: x.credit - amount } : x));
    toast.success(`Paiement de ${fcfa(amount)} enregistré pour ${c.name}`);
    setPaying(null); setAmount(0);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Clients</h1>
        <p className="text-sm text-muted-foreground">{clients.length} clients enregistrés.</p>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Nom</th><th className="px-3 py-2.5">Téléphone</th>
              <th className="px-3 py-2.5">Ville</th><th className="px-3 py-2.5 text-right">Total achats</th>
              <th className="px-3 py-2.5 text-right">Crédit dû</th><th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-3 py-2.5 font-medium">{c.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{c.phone}</td>
                <td className="px-3 py-2.5">{c.city}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(c.totalPurchases)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${c.credit > 0 ? "text-destructive" : "text-muted-foreground"}`}>{fcfa(c.credit)}</td>
                <td className="px-3 py-2.5">
                  {c.credit > 0
                    ? <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">Dette</span>
                    : <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">À jour</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {c.credit > 0 && (
                    <div className="flex justify-end gap-1">
                      <button onClick={() => sendReminder(c)} className="p-1.5 rounded text-white" style={{ backgroundColor: "#25D366" }} title="Rappel WhatsApp">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setPaying(c.id); setAmount(c.credit); }} className="p-1.5 rounded bg-primary text-primary-foreground" title="Enregistrer paiement">
                        <Wallet className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paying && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setPaying(null)}>
          <div className="bg-card rounded-xl border border-border max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold">Enregistrer un paiement</h2>
              <button onClick={() => setPaying(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="text-sm text-muted-foreground mb-1">Crédit dû : {fcfa(clients.find((c) => c.id === paying)?.credit || 0)}</div>
            <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            <button onClick={submitPayment} className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Confirmer</button>
          </div>
        </div>
      )}
    </div>
  );
}
