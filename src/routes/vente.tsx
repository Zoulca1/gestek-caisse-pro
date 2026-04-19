import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useData } from "@/lib/store";
import { fcfa, daysUntil } from "@/lib/format";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Minus, Trash2, Search, Camera, Sparkles, MessageCircle, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import type { SaleItem, Sale } from "@/lib/types";

export const Route = createFileRoute("/vente")({
  component: () => <ProtectedLayout require="ventes"><VentePage /></ProtectedLayout>,
});

const PAYMENTS: Sale["payment"][] = ["Espèces", "Orange Money", "Wave", "MTN MoMo", "Crédit client"];

function VentePage() {
  const { products, clients, sales, setSales, setProducts, setClients } = useData();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [payment, setPayment] = useState<Sale["payment"]>("Espèces");
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const totalStock = (p: typeof products[0]) =>
    Object.values(p.stockByStore).reduce((a, b) => a + b, 0);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.barcode.includes(query) || p.ref.toLowerCase().includes(query.toLowerCase())
  );

  const addToCart = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (totalStock(p) === 0) { toast.error("Produit en rupture"); return; }
    if (daysUntil(p.expiry) < 0) { toast.error("Produit expiré"); return; }
    setCart((c) => {
      const existing = c.find((x) => x.productId === id);
      if (existing) return c.map((x) => x.productId === id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { productId: p.id, name: p.name, qty: 1, unitPrice: p.sellPrice, buyPrice: p.buyPrice }];
    });
    toast.success(`${p.name} ajouté`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) => c.flatMap((x) => {
      if (x.productId !== id) return [x];
      const q = x.qty + delta;
      if (q <= 0) return [];
      return [{ ...x, qty: q }];
    }));
  };

  const removeItem = (id: string) => setCart((c) => c.filter((x) => x.productId !== id));
  const clearCart = () => { setCart([]); toast("Panier vidé"); };

  const total = cart.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const profit = cart.reduce((s, it) => s + it.qty * (it.unitPrice - it.buyPrice), 0);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScannerActive(true);
      toast.success("Scanner activé");
    } catch {
      toast.error("Accès caméra refusé — utilisez le mode démo");
    }
  };
  const stopScanner = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScannerActive(false);
  };
  const demoScan = () => {
    const inStock = products.filter((p) => totalStock(p) > 0);
    const p = inStock[Math.floor(Math.random() * inStock.length)];
    if (p) { addToCart(p.id); toast(`📷 Scan démo : ${p.name}`); }
  };

  const validate = (sendWhatsApp: boolean) => {
    if (cart.length === 0) { toast.error("Panier vide"); return; }
    if (payment === "Crédit client" && !clientId) { toast.error("Sélectionnez un client pour le crédit"); return; }

    const client = clients.find((c) => c.id === clientId);
    const newNumber = "V-" + String(sales.length + 1).padStart(4, "0");
    const sale: Sale = {
      id: "sale-" + Date.now(),
      number: newNumber,
      date: new Date().toISOString(),
      clientId: clientId || null,
      clientName: client?.name || "Client passant",
      items: cart,
      total, profit, payment,
    };
    setSales([sale, ...sales]);

    // décrémenter stock (depuis Yopougon en priorité)
    const updated = products.map((p) => {
      const it = cart.find((c) => c.productId === p.id);
      if (!it) return p;
      let remaining = it.qty;
      const stock = { ...p.stockByStore };
      for (const k of Object.keys(stock)) {
        const take = Math.min(stock[k], remaining);
        stock[k] -= take; remaining -= take;
        if (remaining <= 0) break;
      }
      return { ...p, stockByStore: stock };
    });
    setProducts(updated);

    if (client) {
      setClients(clients.map((c) => c.id === client.id ? {
        ...c,
        totalPurchases: c.totalPurchases + total,
        credit: payment === "Crédit client" ? c.credit + total : c.credit,
      } : c));
    }

    if (sendWhatsApp) {
      const lines = cart.map((it) => `• ${it.qty} × ${it.name} = ${fcfa(it.qty * it.unitPrice)}`).join("%0A");
      const msg = `*Reçu KOFFI ${newNumber}*%0A${lines}%0A%0A*Total : ${fcfa(total)}*%0APaiement : ${payment}%0AMerci de votre visite !`;
      const phone = client?.phone?.replace(/\D/g, "") || "";
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    } else {
      toast.success(`Vente ${newNumber} enregistrée — ${fcfa(total)}`);
    }

    setCart([]); setClientId(""); setPayment("Espèces");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Nouvelle vente</h1>
        <p className="text-sm text-muted-foreground">Caisse rapide avec scanner et reçu WhatsApp.</p>
      </div>

      {/* Scanner */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex flex-wrap items-center gap-2">
          {!scannerActive ? (
            <button onClick={startScanner} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow">
              <Camera className="h-4 w-4" /> Activer le scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold">
              <X className="h-4 w-4" /> Désactiver
            </button>
          )}
          <button onClick={demoScan} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-gold-foreground text-sm font-semibold hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Tester (démo)
          </button>
          {scannerActive && (
            <div className="relative ml-auto h-20 w-40 rounded-lg overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gold animate-scan shadow-[0_0_8px_var(--color-gold)]" />
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Produits */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit, code-barres, référence…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((p) => {
              const stock = totalStock(p);
              const margin = ((p.sellPrice - p.buyPrice) / p.buyPrice) * 100;
              const expired = daysUntil(p.expiry) < 0;
              const disabled = stock === 0 || expired;
              return (
                <div key={p.id} className="p-3 rounded-lg border border-border bg-card flex gap-3">
                  <div className="text-3xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{fcfa(p.sellPrice)} · marge {margin.toFixed(0)}%</div>
                    <div className="text-xs mt-0.5">
                      <span className={stock === 0 ? "text-destructive font-semibold" : stock <= p.threshold ? "text-warning-foreground" : "text-muted-foreground"}>
                        Stock : {stock}
                      </span>
                    </div>
                    <button disabled={disabled} onClick={() => addToCart(p.id)}
                      className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus className="h-3 w-3" /> {expired ? "Expiré" : stock === 0 ? "Rupture" : "Ajouter"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panier */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-card border border-border space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">Panier ({cart.length})</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Vider
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">Aucun article</div>}
            {cart.map((it) => (
              <div key={it.productId} className="p-2.5 rounded-lg bg-muted/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate flex-1">{it.name}</div>
                  <button onClick={() => removeItem(it.productId)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(it.productId, -1)} className="h-6 w-6 rounded grid place-items-center bg-background border border-border hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{it.qty}</span>
                    <button onClick={() => updateQty(it.productId, 1)} className="h-6 w-6 rounded grid place-items-center bg-background border border-border hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{fcfa(it.qty * it.unitPrice)}</div>
                    <div className="text-[10px] text-primary">+{fcfa(it.qty * (it.unitPrice - it.buyPrice))} bénéf.</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-input bg-background">
              <option value="">— Client passant —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
            </select>
            <select value={payment} onChange={(e) => setPayment(e.target.value as any)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-input bg-background">
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-1 pt-2 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display font-bold text-xl tabular-nums">{fcfa(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bénéfice estimé</span>
              <span className="font-bold text-primary tabular-nums">{fcfa(profit)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => validate(false)} disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold text-gold-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40">
              <Receipt className="h-4 w-4" /> Valider & imprimer le reçu
            </button>
            <button onClick={() => validate(true)} disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-whatsapp text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: "#25D366" }}>
              <MessageCircle className="h-4 w-4" /> Envoyer reçu sur WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
