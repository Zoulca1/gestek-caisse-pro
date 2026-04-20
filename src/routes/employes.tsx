import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate } from "@/lib/format";
import { useMemo, useState } from "react";
import { Plus, X, Printer, ChevronLeft, ChevronRight, CheckCircle2, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { Employee, EmployeePosition, SalaryAdvance, SalaryPayment } from "@/lib/types";

export const Route = createFileRoute("/employes")({
  component: () => <ProtectedLayout require="admin"><EmployesPage /></ProtectedLayout>,
});

const POSITIONS: EmployeePosition[] = ["Caissier", "Vendeur", "Magasinier", "Livreur", "Comptable", "Gérant", "Autre"];

const monthKey = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

function EmployesPage() {
  const [tab, setTab] = useState<"liste" | "salaires" | "historique">("liste");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Employés & salaires</h1>
        <p className="text-sm text-muted-foreground">Gestion du personnel et de la masse salariale.</p>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          ["liste", "Liste des employés"],
          ["salaires", "Gestion des salaires"],
          ["historique", "Historique"],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "liste" && <ListeTab />}
      {tab === "salaires" && <SalairesTab />}
      {tab === "historique" && <HistoriqueTab />}
    </div>
  );
}

function ListeTab() {
  const { employees, setEmployees } = useData();
  const [modal, setModal] = useState<Employee | null>(null);

  const openNew = () => setModal({
    id: "em-" + Date.now(), name: "", position: "Caissier", phone: "",
    baseSalary: 0, hireDate: new Date().toISOString(), idNumber: "", active: true,
  });

  const save = () => {
    if (!modal) return;
    if (!modal.name.trim()) { toast.error("Nom requis"); return; }
    const exists = employees.find((e) => e.id === modal.id);
    setEmployees(exists ? employees.map((e) => e.id === modal.id ? modal : e) : [...employees, modal]);
    setModal(null);
    toast.success("Employé enregistré");
  };

  const toggle = (e: Employee) => {
    setEmployees(employees.map((x) => x.id === e.id ? { ...x, active: !x.active } : x));
  };

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Ajouter un employé
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Photo</th><th className="px-3 py-2.5">Nom</th>
              <th className="px-3 py-2.5">Poste</th><th className="px-3 py-2.5">Téléphone</th>
              <th className="px-3 py-2.5 text-right">Salaire</th>
              <th className="px-3 py-2.5">Embauche</th><th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-3 py-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                    {e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-medium">{e.name}</td>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{e.position}</span></td>
                <td className="px-3 py-2.5 font-mono text-xs">{e.phone}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(e.baseSalary)}</td>
                <td className="px-3 py-2.5 text-xs">{formatDate(e.hireDate)}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {e.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => setModal(e)} className="text-xs text-primary hover:underline mr-2">Modifier</button>
                  <button onClick={() => toggle(e)} className="text-xs text-muted-foreground hover:underline">{e.active ? "Désactiver" : "Activer"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-card rounded-xl w-full max-w-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold">Employé</h2>
              <button onClick={() => setModal(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nom complet"><input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} className="input" /></Field>
              <Field label="Poste">
                <select value={modal.position} onChange={(e) => setModal({ ...modal, position: e.target.value as EmployeePosition })} className="input">
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Téléphone"><input value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} className="input" /></Field>
              <Field label="Salaire mensuel FCFA"><input type="number" value={modal.baseSalary} onChange={(e) => setModal({ ...modal, baseSalary: +e.target.value })} className="input" /></Field>
              <Field label="Date d'embauche"><input type="date" value={modal.hireDate.slice(0, 10)} onChange={(e) => setModal({ ...modal, hireDate: new Date(e.target.value).toISOString() })} className="input" /></Field>
              <Field label="N° pièce d'identité"><input value={modal.idNumber || ""} onChange={(e) => setModal({ ...modal, idNumber: e.target.value })} className="input" /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModal(null)} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={save} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Enregistrer</button>
            </div>
            <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: any) {
  return <label className="block"><span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span><div className="mt-1">{children}</div></label>;
}

function SalairesTab() {
  const { employees, advances, setAdvances, salaryPayments, setSalaryPayments, company } = useData();
  const [cursor, setCursor] = useState(new Date());
  const key = monthKey(cursor);
  const label = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const [advModal, setAdvModal] = useState<{ employeeId: string; name: string } | null>(null);
  const [advForm, setAdvForm] = useState({ amount: "", reason: "", date: new Date().toISOString().slice(0, 10) });
  const [payModal, setPayModal] = useState<{ row: any } | null>(null);
  const [payMethod, setPayMethod] = useState<"Espèces" | "Mobile Money">("Mobile Money");
  const [bonusEdit, setBonusEdit] = useState<Record<string, number>>({});
  const [printing, setPrinting] = useState<any>(null);

  const rows = useMemo(() => {
    return employees.filter((e) => e.active).map((e) => {
      const advs = advances.filter((a) => a.employeeId === e.id && a.monthKey === key);
      const advTotal = advs.reduce((s, a) => s + a.amount, 0);
      const existingPay = salaryPayments.find((p) => p.employeeId === e.id && p.monthKey === key);
      const bonus = existingPay?.bonus ?? bonusEdit[e.id] ?? 0;
      const net = e.baseSalary - advTotal + bonus;
      return { employee: e, advances: advs, advTotal, bonus, net, payment: existingPay };
    });
  }, [employees, advances, salaryPayments, key, bonusEdit]);

  const submitAdvance = () => {
    if (!advModal) return;
    const amt = parseFloat(advForm.amount);
    if (!amt || amt <= 0) { toast.error("Montant invalide"); return; }
    const newAdv: SalaryAdvance = {
      id: "av-" + Date.now(),
      employeeId: advModal.employeeId,
      amount: amt,
      date: new Date(advForm.date).toISOString(),
      reason: advForm.reason || "—",
      monthKey: key,
    };
    setAdvances([newAdv, ...advances]);
    setAdvModal(null); setAdvForm({ amount: "", reason: "", date: new Date().toISOString().slice(0, 10) });
    toast.success("Avance enregistrée");
  };

  const markPaid = (row: any, method: "Espèces" | "Mobile Money") => {
    const pay: SalaryPayment = {
      id: "sal-" + key + "-" + row.employee.id,
      employeeId: row.employee.id,
      employeeName: row.employee.name,
      monthKey: key,
      base: row.employee.baseSalary,
      advances: row.advTotal,
      bonus: row.bonus,
      net: row.net,
      paid: true,
      paidAt: new Date().toISOString(),
      method,
    };
    const others = salaryPayments.filter((p) => !(p.employeeId === row.employee.id && p.monthKey === key));
    setSalaryPayments([...others, pay]);
    toast.success(`Salaire payé : ${row.employee.name}`);
  };

  const payAll = () => {
    if (!confirm("Payer tous les salaires en attente du mois ?")) return;
    const now = new Date().toISOString();
    const newPayments = rows.filter((r) => !r.payment?.paid).map((r) => ({
      id: "sal-" + key + "-" + r.employee.id,
      employeeId: r.employee.id, employeeName: r.employee.name, monthKey: key,
      base: r.employee.baseSalary, advances: r.advTotal, bonus: r.bonus, net: r.net,
      paid: true, paidAt: now, method: "Mobile Money" as const,
    }));
    const others = salaryPayments.filter((p) => p.monthKey !== key || rows.find((r) => r.employee.id === p.employeeId)?.payment?.paid);
    setSalaryPayments([...others, ...newPayments]);
    toast.success(`${newPayments.length} salaire(s) payé(s)`);
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-2 rounded-lg border border-border hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <div className="font-display font-bold text-lg capitalize px-3">{label}</div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-2 rounded-lg border border-border hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <button onClick={payAll} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-semibold">
          <Wallet className="h-4 w-4" /> Payer tous
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Employé</th>
              <th className="px-3 py-2.5 text-right">Salaire base</th>
              <th className="px-3 py-2.5 text-right">Avances</th>
              <th className="px-3 py-2.5 text-right">Bonus</th>
              <th className="px-3 py-2.5 text-right">Net à payer</th>
              <th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employee.id} className="border-t border-border">
                <td className="px-3 py-2.5 font-medium">{r.employee.name}<div className="text-xs text-muted-foreground">{r.employee.position}</div></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(r.employee.baseSalary)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-destructive">- {fcfa(r.advTotal)}</td>
                <td className="px-3 py-2.5 text-right">
                  {r.payment?.paid ? (
                    <span className="tabular-nums text-success">+ {fcfa(r.bonus)}</span>
                  ) : (
                    <input type="number" value={r.bonus} onChange={(e) => setBonusEdit({ ...bonusEdit, [r.employee.id]: +e.target.value })}
                      className="w-24 px-2 py-1 text-right rounded border border-input bg-background text-sm" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-gold">{fcfa(r.net)}</td>
                <td className="px-3 py-2.5">
                  {r.payment?.paid ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">
                      Payé · {formatDate(r.payment.paidAt!)}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground">En attente</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setAdvModal({ employeeId: r.employee.id, name: r.employee.name })}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">Avance</button>
                    {!r.payment?.paid && (
                      <button onClick={() => setPayModal({ row: r })} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">Payer</button>
                    )}
                    <button onClick={() => setPrinting({ row: r, company, monthLabel: label })} className="text-xs p-1 rounded border border-border" title="Bulletin">
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {advModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Avance · {advModal.name}</h3>
              <button onClick={() => setAdvModal(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Montant FCFA"><input type="number" value={advForm.amount} onChange={(e) => setAdvForm({ ...advForm, amount: e.target.value })} className="input" /></Field>
              <Field label="Date"><input type="date" value={advForm.date} onChange={(e) => setAdvForm({ ...advForm, date: e.target.value })} className="input" /></Field>
              <Field label="Motif"><input value={advForm.reason} onChange={(e) => setAdvForm({ ...advForm, reason: e.target.value })} className="input" /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAdvModal(null)} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={submitAdvance} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Enregistrer</button>
            </div>
            <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-5 border border-border">
            <h3 className="font-bold mb-3">Marquer comme payé</h3>
            <p className="text-sm mb-3">Net : <span className="font-bold text-gold">{fcfa(payModal.row.net)}</span></p>
            <Field label="Mode de paiement">
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="input">
                <option>Espèces</option><option>Mobile Money</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPayModal(null)} className="px-3 py-2 rounded-lg border border-border text-sm">Annuler</button>
              <button onClick={() => { markPaid(payModal.row, payMethod); setPayModal(null); }}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Confirmer
              </button>
            </div>
            <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--color-input);background:var(--color-background);font-size:.875rem}`}</style>
          </div>
        </div>
      )}

      {printing && <Bulletin {...printing} onClose={() => setPrinting(null)} />}
    </>
  );
}

function Bulletin({ row, company, monthLabel, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto print:bg-white print:p-0 print:block">
      <div className="bg-white text-black rounded-xl w-full max-w-md p-6 my-8 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold">{company.name}</div>
            <div className="text-xs text-gray-600">{company.address}</div>
          </div>
          <div className="h-10 w-10 rounded bg-[#1B5E20] text-white grid place-items-center font-bold">G</div>
        </div>
        <h1 className="text-center text-xl font-bold border-y-2 border-[#1B5E20] py-2 mb-4">BULLETIN DE SALAIRE</h1>
        <div className="text-sm capitalize text-center text-gray-600 mb-4">{monthLabel}</div>

        <div className="text-sm space-y-1 mb-4">
          <div><span className="text-gray-500">Employé :</span> <span className="font-bold">{row.employee.name}</span></div>
          <div><span className="text-gray-500">Poste :</span> {row.employee.position}</div>
        </div>

        <table className="w-full text-sm border-collapse mb-4">
          <tbody>
            <tr className="border-b"><td className="py-1.5">Salaire de base</td><td className="text-right tabular-nums">{fcfa(row.employee.baseSalary)}</td></tr>
            <tr className="border-b"><td className="py-1.5">Avances déduites</td><td className="text-right tabular-nums text-red-600">- {fcfa(row.advTotal)}</td></tr>
            {row.advances.length > 0 && (
              <tr><td colSpan={2} className="text-xs text-gray-500 pl-3 pb-2">
                {row.advances.map((a: any) => `${formatDate(a.date)} : ${fcfa(a.amount)} (${a.reason})`).join(" · ")}
              </td></tr>
            )}
            <tr className="border-b"><td className="py-1.5">Bonus / prime</td><td className="text-right tabular-nums text-green-600">+ {fcfa(row.bonus)}</td></tr>
            <tr className="bg-yellow-50 border-2 border-[#F9A825]">
              <td className="py-2 px-2 font-bold">NET À PAYER</td>
              <td className="py-2 px-2 text-right font-bold text-lg tabular-nums">{fcfa(row.net)}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 mt-10 text-xs">
          <div className="text-center"><div className="border-t border-gray-400 pt-1">Signature employeur</div></div>
          <div className="text-center"><div className="border-t border-gray-400 pt-1">Signature employé</div></div>
        </div>

        <div className="text-center text-[10px] text-gray-500 border-t border-gray-200 pt-2 mt-4">
          GESTEK — Gérez mieux. Vendez plus.
        </div>

        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">Fermer</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-[#1B5E20] text-white text-sm font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoriqueTab() {
  const { salaryPayments, employees } = useData();
  const [filterEmp, setFilterEmp] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const filtered = salaryPayments.filter((p) =>
    (!filterEmp || p.employeeId === filterEmp) && (!filterMonth || p.monthKey === filterMonth)
  ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const monthsAvailable = [...new Set(salaryPayments.map((p) => p.monthKey))].sort().reverse();

  const monthlyTotal = useMemo(() => {
    const map = new Map<string, number>();
    salaryPayments.filter((p) => p.paid).forEach((p) => map.set(p.monthKey, (map.get(p.monthKey) || 0) + p.net));
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [salaryPayments]);

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        {monthlyTotal.slice(0, 3).map(([k, v]) => (
          <div key={k} className="p-4 rounded-xl bg-card border border-border">
            <div className="text-xs uppercase text-muted-foreground font-semibold">Masse salariale {k}</div>
            <div className="font-display font-bold text-xl text-gold tabular-nums mt-1">{fcfa(v)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm">
          <option value="">Tous les employés</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm">
          <option value="">Tous les mois</option>
          {monthsAvailable.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">Mois</th><th className="px-3 py-2.5">Employé</th>
              <th className="px-3 py-2.5 text-right">Base</th><th className="px-3 py-2.5 text-right">Avances</th>
              <th className="px-3 py-2.5 text-right">Bonus</th><th className="px-3 py-2.5 text-right">Net</th>
              <th className="px-3 py-2.5">Mode</th><th className="px-3 py-2.5">Date paiement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{p.monthKey}</td>
                <td className="px-3 py-2 font-medium">{p.employeeName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fcfa(p.base)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-destructive">{fcfa(p.advances)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-success">{fcfa(p.bonus)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-gold">{fcfa(p.net)}</td>
                <td className="px-3 py-2 text-xs">{p.method || "—"}</td>
                <td className="px-3 py-2 text-xs">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Aucun paiement</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
