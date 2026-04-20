import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate } from "@/lib/format";
import { useMemo, useState } from "react";
import { Plus, X, MessageCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { SupplierDebt } from "@/lib/types";

export const Route = createFileRoute("/fournisseurs")({
  component: () => <ProtectedLayout><FournisseursPage /></ProtectedLayout>,
});

function FournisseursPage() {
  const { suppliers, supplierDebts } = useData();
  const openDebts = supplierDebts.filter((d) => d.status === "open");
  const [tab, setTab] = useState<"liste" | "dettes">("liste");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Fournisseurs</h1>
        <p className="text-sm text-muted-foreground">{suppliers.length} fournisseurs · {openDebts.length} dette(s) en cours.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setTab("liste")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === "liste" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          Fournisseurs
        </button>
        <button onClick={() => setTab("dettes")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 ${tab === "dettes" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          Dettes en cours
          {openDebts.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">{openDebts.length}</span>}
        </button>
      </div>

      {tab === "liste" ? <ListeTab /> : <DettesTab />}
    </div>
  );
}

function ListeTab() {
  const { suppliers } = useData();
  return (
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
  );
}

function DettesTab() {
  const { suppliers, supplierDebts, setSupplierDebts, company } = useData();
  const [modal, setModal] = useState<SupplierDebt | null>(null);
  const [payModal, setPayModal] = useState<SupplierDebt | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const open = supplierDebts.filter((d) => d.status === "open");
  const totalDue = open.reduce((s, d) => s + d.amount, 0);
  const creditors = new Set(open.map((d) => d.supplierId)).size;
  const mostUrgent = useMemo(
    () => [...open].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0],
    [open]
  );

  const sorted = [...supplierDebts].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return +new Date(a.dueDate) - +new Date(b.dueDate);
  });

  const openNew = () => setModal({
    id: "d-" + Date.now(),
    supplierId: suppliers[0]?.id || "",
    supplierName: suppliers[0]?.name || "",
    amount: 0, purchaseDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    description: "", status: "open",
  });

  const save = () => {
    if (!modal) return;
    if (!modal.amount || modal.amount <= 0) { toast.error("Montant invalide"); return; }
    const sup = suppliers.find((s) => s.id === modal.supplierId);
    const final = { ...modal, supplierName: sup?.name || modal.supplierName };
    const exists = supplierDebts.find((d) => d.id === modal.id);
    setSupplierDebts(exists ? supplierDebts.map((d) => d.id === modal.id ? final : d) : [final, ...supplierDebts]);
    setModal(null);
    toast.success("Dette enregistrée");
  };

  const markPaid = () => {
    if (!payModal) return;
    const amt = parseFloat(payAmount) || payModal.amount;
    setSupplierDebts(supplierDebts.map((d) => d.id === payModal.id
      ? { ...d, status: "paid" as const, paidAt: new Date().toISOString(), paidAmount: amt } : d));
    setPayModal(null); setPayAmount("");
    toast.success("Dette marquée comme payée");
  };

  const sendReminder = (d: SupplierDebt) => {
    const sup = suppliers.find((s) => s.id === d.supplierId);
    const phone = sup?.phone?.replace(/\D/g, "") || "";
    const msg = `Bonjour ${d.supplierName}, nous vous informons que nous allons procéder au paiement de ${fcfa(d.amount)} avant le ${formatDate(d.dueDate)}.%0AMerci — ${company.name}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const statusOf = (d: SupplierDebt) => {
    if (d.status === "paid") return { label: "Payée", cls: "bg-success/15 text-success" };
    const days = Math.ceil((+new Date(d.dueDate) - Date.now()) / 86400000);
    if (days < 0) return { label: "En retard", cls: "bg-destructive/15 text-destructive animate-blink" };
    if (days <= 15) return { label: "Urgent", cls: "bg-warning/20 text-warning-foreground" };
    return { label: "À jour", cls: "bg-success/15 text-success" };
  };

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Total dû</div>
          <div className="font-display font-bold text-2xl text-destructive tabular-nums mt-1">{fcfa(totalDue)}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Fournisseurs créditeurs</div>
          <div className="font-display font-bold text-2xl mt-1">{creditors}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Plus urgente
          </div>
          {mostUrgent ? (
            <>
              <div className="font-display font-bold text-base mt-1">{mostUrgent.supplierName}</div>
              <div className="text-xs text-muted-foreground">{fcfa(mostUrgent.amount)} · échéance {formatDate(mostUrgent.dueDate)}</div>
            </>
          ) : <div className="text-sm text-muted-foreground mt-1">Aucune</div>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Enregistrer une dette
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Fournisseur</th><th className="px-3 py-2.5 text-right">Montant</th>
              <th className="px-3 py-2.5">Date achat</th><th className="px-3 py-2.5">Échéance</th>
              <th className="px-3 py-2.5 text-right">Jours restants</th>
              <th className="px-3 py-2.5">Statut</th><th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const days = Math.ceil((+new Date(d.dueDate) - Date.now()) / 86400000);
              const st = statusOf(d);
              return (
                <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium">{d.supplierName}<div className="text-xs text-muted-foreground">{d.description}</div></td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(d.amount)}</td>
                  <td className="px-3 py-2.5 text-xs">{formatDate(d.purchaseDate)}</td>
                  <td className="px-3 py-2.5 text-xs">{formatDate(d.dueDate)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${days < 0 ? "text-destructive" : days <= 15 ? "text-warning-foreground" : "text-success"}`}>
                    {d.status === "paid" ? "—" : `${days}j`}
                  </td>
                  <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="px-3 py-2.5 text-right">
                    {d.status === "open" && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => sendReminder(d)} className="px-2 py-1 rounded text-white text-xs flex items-center gap-1" style={{ backgroundColor: "#25D366" }}>
                          <MessageCircle className="h-3 w-3" /> WA
                        </button>
                        <button onClick={() => { setPayModal(d); setPayAmount(String(d.amount)); }}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Payée
                        </button>
                      </div>
                    )}
                    {d.status === "paid" && d.paidAt && <span className="text-xs text-muted-foreground">Payée le {formatDate(d.paidAt)}</span>}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Aucune dette enregistrée</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-card rounded-xl w-full max-w-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-3"><h3 className="font-bold">Nouvelle dette fournisseur</h3><button onClick={() => setModal(null)}><X className="h-5 w-5" /></button></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Fournisseur</span>
                <select value={modal.supplierId} onChange={(e) => setModal({ ...modal, supplierId: e.target.value })} className="mt-1 input">
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Montant FCFA</span>
                <input type="number" value={modal.amount} onChange={(e) => setModal({ ...modal, amount: +e.target.value })} className="mt-1 input" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Date achat</span>
                <input type="date" value={modal.purchaseDate.slice(0, 10)} onChange={(e) => setModal({ ...modal, purchaseDate: new Date(e.target.value).toISOString() })} className="mt-1 input" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Échéance</span>
                <input type="date" value={modal.dueDate.slice(0, 10)} onChange={(e) => setModal({ ...modal, dueDate: new Date(e.target.value).toISOString() })} className="mt-1 input" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Description (produits achetés)</span>
                <input value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} className="mt-1 input" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModal(null)} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={save} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Enregistrer</button>
            </div>
            <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-5 border border-border">
            <h3 className="font-bold mb-3">Confirmer le paiement · {payModal.supplierName}</h3>
            <p className="text-sm text-muted-foreground mb-3">Dette initiale : <span className="font-bold">{fcfa(payModal.amount)}</span></p>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Montant payé FCFA</span>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPayModal(null)} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={markPaid} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
