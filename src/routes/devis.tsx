import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, formatDate } from "@/lib/format";
import { useMemo, useState } from "react";
import { Plus, Trash2, Printer, FileText, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { Quote, QuoteLine, QuoteStatus, Sale } from "@/lib/types";

export const Route = createFileRoute("/devis")({
  component: () => <ProtectedLayout><DevisPage /></ProtectedLayout>,
});

const STATUS_COLORS: Record<QuoteStatus, string> = {
  "Brouillon": "bg-muted text-muted-foreground",
  "Envoyé": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "Accepté": "bg-success/15 text-success",
  "Refusé": "bg-destructive/15 text-destructive",
  "Converti": "bg-gold/20 text-gold-foreground",
};

function computeTotal(lines: QuoteLine[], globalDiscount: number) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 - l.discount / 100), 0);
  return subtotal * (1 - globalDiscount / 100);
}

function DevisPage() {
  const { quotes, setQuotes, products, clients, sales, setSales, company } = useData();
  const [editing, setEditing] = useState<Quote | null>(null);
  const [previewing, setPreviewing] = useState<Quote | null>(null);

  const newQuote = () => {
    const num = "DEV-" + String(quotes.length + 1).padStart(4, "0");
    const today = new Date();
    const validity = new Date(); validity.setDate(validity.getDate() + 30);
    setEditing({
      id: "q-" + Date.now(),
      number: num,
      date: today.toISOString(),
      validity: validity.toISOString(),
      clientId: null, clientName: "",
      lines: [{ productId: null, name: "", qty: 1, unitPrice: 0, discount: 0 }],
      globalDiscount: 0, total: 0,
      notes: "Validité 30 jours. Paiement à réception.",
      status: "Brouillon",
    });
  };

  const saveQuote = (q: Quote) => {
    const total = computeTotal(q.lines, q.globalDiscount);
    const final = { ...q, total };
    const exists = quotes.find((x) => x.id === q.id);
    setQuotes(exists ? quotes.map((x) => x.id === q.id ? final : x) : [final, ...quotes]);
    setEditing(null);
    toast.success(`Devis ${q.number} enregistré`);
  };

  const updateStatus = (id: string, status: QuoteStatus) => {
    setQuotes(quotes.map((q) => q.id === id ? { ...q, status } : q));
    toast.success("Statut mis à jour");
  };

  const deleteQuote = (id: string) => {
    if (!confirm("Supprimer ce devis ?")) return;
    setQuotes(quotes.filter((q) => q.id !== id));
    toast.success("Devis supprimé");
  };

  const convertToSale = (q: Quote) => {
    if (!confirm(`Convertir le devis ${q.number} en vente ?`)) return;
    const items = q.lines.filter((l) => l.productId).map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return {
        productId: l.productId!, name: l.name, qty: l.qty,
        unitPrice: l.unitPrice * (1 - l.discount / 100),
        buyPrice: p?.buyPrice || 0,
      };
    });
    const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const profit = items.reduce((s, i) => s + i.qty * (i.unitPrice - i.buyPrice), 0);
    const newSale: Sale = {
      id: "sale-" + Date.now(),
      number: "V-" + String(sales.length + 1).padStart(4, "0"),
      date: new Date().toISOString(),
      clientId: q.clientId, clientName: q.clientName || "Client passant",
      items, total, profit, payment: "Espèces",
    };
    setSales([newSale, ...sales]);
    setQuotes(quotes.map((x) => x.id === q.id ? { ...x, status: "Converti" as QuoteStatus } : x));
    toast.success(`Vente ${newSale.number} créée depuis le devis`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Devis</h1>
          <p className="text-sm text-muted-foreground">{quotes.length} devis · création et impression A4 professionnelle.</p>
        </div>
        <button onClick={newQuote} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Nouveau devis
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2.5">N° devis</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Client</th>
              <th className="px-3 py-2.5 text-right">Articles</th>
              <th className="px-3 py-2.5 text-right">Total</th>
              <th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-3 py-2.5 font-mono text-xs">{q.number}</td>
                <td className="px-3 py-2.5">{formatDate(q.date)}</td>
                <td className="px-3 py-2.5 font-medium">{q.clientName || "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{q.lines.length}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fcfa(q.total)}</td>
                <td className="px-3 py-2.5">
                  <select value={q.status} onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                    className={`text-xs px-2 py-1 rounded-full font-semibold border-0 ${STATUS_COLORS[q.status]}`}>
                    <option>Brouillon</option><option>Envoyé</option><option>Accepté</option>
                    <option>Refusé</option><option>Converti</option>
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setPreviewing(q)} className="p-1.5 rounded hover:bg-muted" title="Aperçu / Imprimer">
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditing(q)} className="p-1.5 rounded hover:bg-muted" title="Modifier">
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    {q.status === "Accepté" && (
                      <button onClick={() => convertToSale(q)} className="p-1.5 rounded hover:bg-muted text-gold" title="Convertir en vente">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteQuote(q.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Aucun devis</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <QuoteEditor q={editing} products={products} clients={clients}
          onClose={() => setEditing(null)} onSave={saveQuote}
          onPreview={(qq: Quote) => { saveQuote(qq); setPreviewing({ ...qq, total: computeTotal(qq.lines, qq.globalDiscount) }); }} />
      )}
      {previewing && <QuotePreview q={previewing} company={company} onClose={() => setPreviewing(null)} />}
    </div>
  );
}

function QuoteEditor({ q, products, clients, onClose, onSave, onPreview }: any) {
  const [draft, setDraft] = useState<Quote>(q);
  const total = computeTotal(draft.lines, draft.globalDiscount);

  const setLine = (i: number, patch: Partial<QuoteLine>) => {
    setDraft({ ...draft, lines: draft.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) });
  };
  const addLine = () => setDraft({ ...draft, lines: [...draft.lines, { productId: null, name: "", qty: 1, unitPrice: 0, discount: 0 }] });
  const removeLine = (i: number) => setDraft({ ...draft, lines: draft.lines.filter((_, idx) => idx !== i) });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-card rounded-xl w-full max-w-4xl p-5 my-8 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Devis {draft.number}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Client</span>
            <select value={draft.clientId || ""}
              onChange={(e) => {
                const c = clients.find((x: any) => x.id === e.target.value);
                setDraft({ ...draft, clientId: c?.id || null, clientName: c?.name || draft.clientName });
              }}
              className="mt-1 w-full px-2 py-2 rounded-lg border border-input bg-background text-sm">
              <option value="">— Saisie libre —</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!draft.clientId && (
              <input value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
                placeholder="Nom client" className="mt-1 w-full px-2 py-2 rounded-lg border border-input bg-background text-sm" />
            )}
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Date du devis</span>
            <input type="date" value={draft.date.slice(0, 10)} onChange={(e) => setDraft({ ...draft, date: new Date(e.target.value).toISOString() })}
              className="mt-1 w-full px-2 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Validité jusqu'au</span>
            <input type="date" value={draft.validity.slice(0, 10)} onChange={(e) => setDraft({ ...draft, validity: new Date(e.target.value).toISOString() })}
              className="mt-1 w-full px-2 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-2 py-2 text-left">Produit</th><th className="px-2 py-2">Qté</th><th className="px-2 py-2">PU</th><th className="px-2 py-2">Remise %</th><th className="px-2 py-2 text-right">Total</th><th></th></tr>
            </thead>
            <tbody>
              {draft.lines.map((l, i) => {
                const lt = l.qty * l.unitPrice * (1 - l.discount / 100);
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1.5">
                      <select value={l.productId || ""} onChange={(e) => {
                        const p = products.find((x: any) => x.id === e.target.value);
                        setLine(i, p ? { productId: p.id, name: p.name, unitPrice: p.sellPrice } : { productId: null });
                      }}
                        className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs">
                        <option value="">— Saisie libre —</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {!l.productId && (
                        <input value={l.name} onChange={(e) => setLine(i, { name: e.target.value })}
                          className="mt-1 w-full px-2 py-1 rounded border border-input bg-background text-xs" placeholder="Désignation" />
                      )}
                    </td>
                    <td className="px-2 py-1.5"><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, +e.target.value) })} className="w-16 px-2 py-1 rounded border border-input bg-background text-sm" /></td>
                    <td className="px-2 py-1.5"><input type="number" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: +e.target.value })} className="w-24 px-2 py-1 rounded border border-input bg-background text-sm" /></td>
                    <td className="px-2 py-1.5"><input type="number" value={l.discount} onChange={(e) => setLine(i, { discount: +e.target.value })} className="w-16 px-2 py-1 rounded border border-input bg-background text-sm" /></td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{fcfa(lt)}</td>
                    <td className="px-2 py-1.5"><button onClick={() => removeLine(i)} className="text-destructive p-1"><X className="h-3.5 w-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={addLine} className="mt-2 text-xs text-primary font-semibold flex items-center gap-1">
          <Plus className="h-3 w-3" /> Ajouter une ligne
        </button>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Notes / Conditions</span>
            <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </label>
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Remise globale %</span>
              <input type="number" value={draft.globalDiscount} onChange={(e) => setDraft({ ...draft, globalDiscount: +e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            </label>
            <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
              <span className="text-sm font-semibold">TOTAL TTC</span>
              <span className="font-display font-bold text-2xl text-gold tabular-nums">{fcfa(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => onPreview(draft)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Aperçu / impression
          </button>
          <button onClick={() => onSave(draft)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Enregistrer le devis
          </button>
        </div>
      </div>
    </div>
  );
}

function QuotePreview({ q, company, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto print:bg-white print:p-0 print:block">
      <div className="bg-white text-black rounded-xl w-full max-w-3xl p-8 my-8 print:shadow-none print:rounded-none print:max-w-full print:my-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-12 w-12 rounded-lg bg-[#1B5E20] text-white grid place-items-center font-bold text-lg">G</div>
              <div>
                <div className="font-bold text-lg">GESTEK</div>
                <div className="text-xs text-gray-500">Logiciels sur mesure</div>
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-bold">{company.name}</div>
            <div className="text-xs text-gray-600">{company.address}</div>
            <div className="text-xs text-gray-600">{company.phone} · {company.email}</div>
            <div className="text-[10px] text-gray-500 mt-1">RCCM : {company.rccm}</div>
          </div>
        </div>

        <h1 className="text-center text-3xl font-bold tracking-wider mb-6 border-y-2 border-[#1B5E20] py-2">
          DEVIS N° {q.number}
        </h1>

        <div className="flex justify-between mb-4 text-sm">
          <div>
            <div className="text-xs uppercase font-bold text-gray-500">Client</div>
            <div className="font-semibold">{q.clientName || "—"}</div>
          </div>
          <div className="text-right">
            <div><span className="text-gray-500">Date :</span> {formatDate(q.date)}</div>
            <div><span className="text-gray-500">Validité jusqu'au :</span> {formatDate(q.validity)}</div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="bg-[#1B5E20] text-white">
              <th className="px-2 py-2 text-left">Désignation</th>
              <th className="px-2 py-2 text-right">Qté</th>
              <th className="px-2 py-2 text-right">PU FCFA</th>
              <th className="px-2 py-2 text-right">Remise</th>
              <th className="px-2 py-2 text-right">Total FCFA</th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l: QuoteLine, i: number) => {
              const lt = l.qty * l.unitPrice * (1 - l.discount / 100);
              return (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-2 py-2">{l.name}</td>
                  <td className="px-2 py-2 text-right">{l.qty}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{l.unitPrice.toLocaleString("fr-FR")}</td>
                  <td className="px-2 py-2 text-right">{l.discount}%</td>
                  <td className="px-2 py-2 text-right tabular-nums font-semibold">{lt.toLocaleString("fr-FR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 border-2 border-[#F9A825] p-3 rounded">
            {q.globalDiscount > 0 && (
              <div className="flex justify-between text-sm"><span>Remise globale</span><span>{q.globalDiscount}%</span></div>
            )}
            <div className="flex justify-between text-lg font-bold mt-1">
              <span>TOTAL TTC</span>
              <span className="tabular-nums">{Math.round(q.total).toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        </div>

        {q.notes && (
          <div className="text-sm mb-6">
            <div className="font-bold text-xs uppercase text-gray-600 mb-1">Conditions</div>
            <div className="text-gray-700 whitespace-pre-wrap">{q.notes}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-12 mb-4 text-sm">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">Signature client</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">Signature {company.name}</div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3 mt-6">
          <div className="font-bold text-[#1B5E20]">GESTEK — Gérez mieux. Vendez plus.</div>
          <div>Contact WhatsApp : {company.phone}</div>
        </div>

        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Fermer</button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-[#1B5E20] text-white text-sm font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
