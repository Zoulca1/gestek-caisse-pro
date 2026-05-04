import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudAuth } from "@/lib/cloud-auth";
import { useTenant } from "@/lib/tenant";
import { Loader2, Plus, Minus, Trash2, Search, ShoppingCart, X, Receipt, FileDown } from "lucide-react";
import { toast } from "sonner";
import { generateInvoiceForSale } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/workspace/ventes")({
  component: SalesCloud,
});

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_quantity: number;
}
interface Customer { id: string; name: string; }
interface CartLine { product: Product; qty: number; }
interface SaleRow {
  id: string; reference: string; total: number; payment_method: string;
  sold_at: string; customer_id: string | null;
}

function SalesCloud() {
  const { tenant } = useTenant();
  const { user } = useCloudAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recent, setRecent] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [payment, setPayment] = useState("especes");
  const [saving, setSaving] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const load = async () => {
    if (!tenant) return;
    setLoading(true);
    const [p, c, s] = await Promise.all([
      supabase.from("products").select("id,name,sku,sale_price,stock_quantity").eq("tenant_id", tenant.id).eq("active", true).order("name"),
      supabase.from("customers").select("id,name").eq("tenant_id", tenant.id).order("name"),
      supabase.from("sales").select("id,reference,total,payment_method,sold_at,customer_id").eq("tenant_id", tenant.id).order("sold_at", { ascending: false }).limit(10),
    ]);
    setProducts((p.data || []) as Product[]);
    setCustomers((c.data || []) as Customer[]);
    setRecent((s.data || []) as SaleRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenant]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const addToCart = (p: Product) => {
    setCart((c) => {
      const ex = c.find((l) => l.product.id === p.id);
      if (ex) return c.map((l) => l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l);
      return [...c, { product: p, qty: 1 }];
    });
  };
  const updateQty = (id: string, qty: number) =>
    setCart((c) => qty <= 0 ? c.filter((l) => l.product.id !== id) : c.map((l) => l.product.id === id ? { ...l, qty } : l));

  const subtotal = cart.reduce((s, l) => s + l.product.sale_price * l.qty, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: tenant?.currency || "XOF", maximumFractionDigits: 0 }).format(n);

  const checkout = async () => {
    if (!tenant || !user || cart.length === 0) return;
    setSaving(true);
    const reference = `V-${Date.now().toString(36).toUpperCase()}`;
    const { data: sale, error } = await supabase.from("sales").insert({
      tenant_id: tenant.id, reference, customer_id: customerId || null,
      seller_id: user.id, subtotal, total: subtotal, payment_method: payment, status: "completed",
    }).select().single();
    if (error || !sale) { setSaving(false); toast.error(error?.message || "Erreur"); return; }

    const items = cart.map((l) => ({
      tenant_id: tenant.id, sale_id: sale.id, product_id: l.product.id,
      product_name: l.product.name, quantity: l.qty, unit_price: l.product.sale_price,
      line_total: l.product.sale_price * l.qty,
    }));
    const { error: itemsErr } = await supabase.from("sale_items").insert(items);
    if (itemsErr) { toast.error(itemsErr.message); setSaving(false); return; }

    // Décrémente le stock
    await Promise.all(cart.map((l) =>
      supabase.from("products").update({ stock_quantity: Math.max(0, l.product.stock_quantity - l.qty) }).eq("id", l.product.id)
    ));

    toast.success(`Vente ${reference} enregistrée — ${fmt(subtotal)}`);
    setCart([]); setCustomerId(""); setShowCart(false);
    load();
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Caisse / Ventes</h1>
          <p className="text-sm text-muted-foreground">Encaissez en quelques clics.</p>
        </div>
        <button onClick={() => setShowCart(true)} className="md:hidden inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4" /> Panier ({cart.length})
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucun produit. Ajoutez des produits depuis le module Produits.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="text-left rounded-xl border border-border bg-card p-3 hover:border-primary hover:shadow-md transition">
                  <div className="font-semibold text-sm line-clamp-2">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Stock: {Number(p.stock_quantity)}</div>
                  <div className="font-display font-bold text-primary mt-2">{fmt(Number(p.sale_price))}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Cart
          className="hidden lg:flex"
          cart={cart} customers={customers} customerId={customerId} setCustomerId={setCustomerId}
          payment={payment} setPayment={setPayment} updateQty={updateQty}
          subtotal={subtotal} fmt={fmt} onCheckout={checkout} saving={saving}
        />
      </div>

      {recent.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display font-bold text-lg">Ventes récentes</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-4 py-2.5">Référence</th><th className="text-left px-4 py-2.5">Date</th><th className="text-left px-4 py-2.5">Paiement</th><th className="text-right px-4 py-2.5">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs">{s.reference}</td>
                    <td className="px-4 py-2.5">{new Date(s.sold_at).toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-2.5 capitalize">{s.payment_method}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmt(Number(s.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="bg-background w-full max-w-sm h-full overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold">Panier</h2>
              <button onClick={() => setShowCart(false)}><X className="h-5 w-5" /></button>
            </div>
            <Cart cart={cart} customers={customers} customerId={customerId} setCustomerId={setCustomerId}
              payment={payment} setPayment={setPayment} updateQty={updateQty}
              subtotal={subtotal} fmt={fmt} onCheckout={checkout} saving={saving} />
          </div>
        </div>
      )}
    </div>
  );
}

function Cart({ className = "", cart, customers, customerId, setCustomerId, payment, setPayment, updateQty, subtotal, fmt, onCheckout, saving }: any) {
  return (
    <aside className={`flex-col gap-3 rounded-xl border border-border bg-card p-4 h-fit sticky top-20 ${className}`}>
      <div className="flex items-center gap-2 font-display font-bold">
        <Receipt className="h-4 w-4" /> Panier
      </div>
      {cart.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">Aucun article. Cliquez sur un produit.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {cart.map((l: CartLine) => (
            <div key={l.product.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.product.name}</div>
                <div className="text-xs text-muted-foreground">{fmt(l.product.sale_price)} × {l.qty}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(l.product.id, l.qty - 1)} className="h-6 w-6 rounded bg-muted grid place-items-center"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-xs">{l.qty}</span>
                <button onClick={() => updateQty(l.product.id, l.qty + 1)} className="h-6 w-6 rounded bg-muted grid place-items-center"><Plus className="h-3 w-3" /></button>
                <button onClick={() => updateQty(l.product.id, 0)} className="h-6 w-6 rounded text-destructive grid place-items-center"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
        <option value="">Client de passage</option>
        {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={payment} onChange={(e) => setPayment(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
        <option value="especes">Espèces</option>
        <option value="mobile_money">Mobile Money</option>
        <option value="carte">Carte bancaire</option>
        <option value="virement">Virement</option>
        <option value="credit">Crédit client</option>
      </select>
      <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border">
        <span>Total</span><span className="tabular-nums">{fmt(subtotal)}</span>
      </div>
      <button onClick={onCheckout} disabled={cart.length === 0 || saving}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
        {saving ? "..." : "Encaisser"}
      </button>
    </aside>
  );
}
