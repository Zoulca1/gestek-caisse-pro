// Demo bootstrap — idempotent. Creates 3 demo users + tenant + seed data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TENANT_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const DEMO_USERS = [
  { email: "demo-admin@gestek.app",   password: "DemoAdmin2026!",   full_name: "Admin Démo",   role: "owner"   as const },
  { email: "demo-vendeur@gestek.app", password: "DemoVendeur2026!", full_name: "Vendeur Démo", role: "vendeur" as const },
  { email: "demo-stock@gestek.app",   password: "DemoStock2026!",   full_name: "Stock Démo",   role: "stock"   as const },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Ensure 3 demo auth users
    const userIds: Record<string, string> = {};
    for (const u of DEMO_USERS) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      let found = list?.users.find((x) => x.email === u.email);
      if (!found) {
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (error) throw new Error(`createUser ${u.email}: ${error.message}`);
        found = data.user!;
      }
      userIds[u.role] = found.id;
    }

    const ownerId = userIds.owner;

    // 2. Ensure tenant exists with proper owner
    const { data: existingTenant } = await admin.from("tenants").select("id").eq("id", TENANT_ID).maybeSingle();
    if (!existingTenant) {
      const { error } = await admin.from("tenants").insert({
        id: TENANT_ID,
        name: "Épicerie Moderne KOFFI (Démo)",
        slug: "demo-koffi",
        activity_type: "alimentaire",
        country: "CI",
        currency: "XOF",
        owner_id: ownerId,
        onboarded: true,
        plan: "trial",
        address: "Boulevard Latrille, Cocody",
        city: "Abidjan",
        country_full: "Côte d'Ivoire",
        phone_company: "+225 07 00 00 00 00",
        email_company: "demo@gestek.app",
        tax_id: "CI-ABJ-2024-B-1234",
        cc_number: "CC-2024-001",
        bank_info: "Banque Atlantique · CI082 0101 1234 5678 9012 3456",
        invoice_prefix: "INV-DEMO",
        invoice_footer: "Merci pour votre confiance. Démo GESTEK — gestek.app",
      });
      if (error) throw new Error(`tenant insert: ${error.message}`);
    } else {
      await admin.from("tenants").update({ owner_id: ownerId }).eq("id", TENANT_ID);
    }

    // 3. Modules
    const modules = ["ventes","stock","clients","fournisseurs","devis","comptabilite","employes","rapports"];
    for (const m of modules) {
      await admin.from("tenant_modules").upsert(
        { tenant_id: TENANT_ID, module: m, enabled: true },
        { onConflict: "tenant_id,module", ignoreDuplicates: true }
      );
    }

    // 4. Members + roles
    for (const u of DEMO_USERS) {
      const uid = userIds[u.role];
      await admin.from("tenant_members").upsert(
        { user_id: uid, tenant_id: TENANT_ID },
        { onConflict: "user_id,tenant_id", ignoreDuplicates: true }
      );
      // role: owner stays owner; others get admin (full access for demo) — actually use exact role
      await admin.from("user_roles").upsert(
        { user_id: uid, tenant_id: TENANT_ID, role: u.role },
        { onConflict: "user_id,tenant_id,role", ignoreDuplicates: true }
      );
    }

    // 5. Seed data — only if no products yet
    const { count: productCount } = await admin
      .from("products").select("*", { count: "exact", head: true }).eq("tenant_id", TENANT_ID);

    if (!productCount || productCount === 0) {
      const products = [
        ["Riz parfumé 5kg","RIZ-5","Épicerie",6500,5200,45,10,"sac"],
        ["Huile végétale 1L","HUI-1L","Épicerie",1500,1100,80,20,"bouteille"],
        ["Sucre poudre 1kg","SUC-1","Épicerie",800,600,120,30,"paquet"],
        ["Sel iodé 500g","SEL-500","Épicerie",350,200,200,50,"paquet"],
        ["Lait concentré 397g","LAIT-CONC","Boissons",1200,900,60,15,"boîte"],
        ["Savon de Marseille","SAV-MAR","Hygiène",500,300,90,25,"pièce"],
        ["Pâtes spaghetti 500g","PATES-500","Épicerie",750,550,70,20,"paquet"],
        ["Sardines à l'huile","SARD-125","Conserve",850,600,100,30,"boîte"],
        ["Café Nescafé 50g","CAF-NES","Boissons",2200,1700,35,10,"pot"],
        ["Tomate concentrée 70g","TOM-70","Conserve",300,180,150,40,"boîte"],
        ["Bissap 1L","BIS-1L","Boissons",1000,600,40,12,"bouteille"],
        ["Farine blé 1kg","FAR-1","Épicerie",700,500,85,20,"paquet"],
      ];
      await admin.from("products").insert(products.map(([name,sku,category,sale_price,cost_price,stock_quantity,stock_alert,unit]) => ({
        tenant_id: TENANT_ID, name, sku, category, sale_price, cost_price, stock_quantity, stock_alert, unit,
      })));

      await admin.from("customers").insert([
        { tenant_id: TENANT_ID, name: "Aminata Traoré", phone: "+225 07 12 34 56 78", email: "aminata@example.ci", city: "Abidjan", loyalty_points: 120 },
        { tenant_id: TENANT_ID, name: "Kouassi Yao", phone: "+225 05 98 76 54 32", city: "Abidjan", loyalty_points: 45 },
        { tenant_id: TENANT_ID, name: "Restaurant Chez Tantie", phone: "+225 07 11 22 33 44", email: "tantie@resto.ci", city: "Cocody", loyalty_points: 380 },
        { tenant_id: TENANT_ID, name: "Fatou Diabaté", phone: "+225 01 22 33 44 55", city: "Yopougon", loyalty_points: 25 },
        { tenant_id: TENANT_ID, name: "Boulangerie du Plateau", phone: "+225 27 20 30 40 50", email: "contact@boul-plateau.ci", city: "Plateau", loyalty_points: 510 },
      ]);

      await admin.from("suppliers").insert([
        { tenant_id: TENANT_ID, name: "Distrib Afrique SA", contact_name: "M. Bamba", phone: "+225 27 21 00 00 01", email: "commande@distrib-afrique.ci", city: "Abidjan", payment_terms: "30 jours" },
        { tenant_id: TENANT_ID, name: "Grossiste Adjamé", contact_name: "Mme. Kone", phone: "+225 07 00 11 22 33", city: "Adjamé", payment_terms: "Comptant" },
        { tenant_id: TENANT_ID, name: "Import Cacao Plus", contact_name: "M. Diallo", phone: "+225 05 44 55 66 77", email: "diallo@cacaoplus.ci", city: "San-Pedro", payment_terms: "15 jours" },
      ]);

      await admin.from("employees").insert([
        { tenant_id: TENANT_ID, full_name: "Marie Aké", position: "Caissière", phone: "+225 07 88 99 00 11", email: "marie@koffi.ci", salary: 120000, hired_at: "2024-03-01", active: true },
        { tenant_id: TENANT_ID, full_name: "Ibrahim Coulibaly", position: "Magasinier", phone: "+225 05 77 88 99 00", salary: 95000, hired_at: "2024-06-15", active: true },
        { tenant_id: TENANT_ID, full_name: "Sylvie N'Guessan", position: "Vendeuse", phone: "+225 01 66 77 88 99", email: "sylvie@koffi.ci", salary: 110000, hired_at: "2025-01-10", active: true },
      ]);

      // Sales over last 30 days
      const sales = [];
      const methods = ["especes","mobile_money","carte","credit"];
      for (let i = 1; i <= 120; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 8);
        const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(d.getHours() - hoursAgo);
        const total = 1500 + Math.floor(Math.random() * 45000);
        sales.push({
          tenant_id: TENANT_ID,
          reference: `V-DEMO-${String(i).padStart(4, "0")}`,
          sold_at: d.toISOString(),
          subtotal: total, total,
          payment_method: methods[Math.floor(Math.random()*4)],
          status: "completed",
        });
      }
      await admin.from("sales").insert(sales);

      const today = new Date();
      const dateMinus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); };
      await admin.from("accounting_entries").insert([
        { tenant_id: TENANT_ID, entry_date: dateMinus(2), entry_type: "expense", label: "Loyer boutique novembre", category: "Loyer", amount: 150000, payment_method: "virement" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(5), entry_type: "expense", label: "Électricité CIE", category: "Charges", amount: 45000, payment_method: "mobile_money" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(8), entry_type: "expense", label: "Réapprovisionnement Distrib Afrique", category: "Achat marchandise", amount: 850000, payment_method: "virement" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(12), entry_type: "expense", label: "Salaires équipe", category: "Salaire", amount: 325000, payment_method: "especes" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(15), entry_type: "income", label: "Vente en gros Boulangerie Plateau", category: "Vente", amount: 95000, payment_method: "virement" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(20), entry_type: "expense", label: "Carburant livraisons", category: "Transport", amount: 18000, payment_method: "especes" },
        { tenant_id: TENANT_ID, entry_date: dateMinus(25), entry_type: "expense", label: "Forfait internet boutique", category: "Charges", amount: 25000, payment_method: "mobile_money" },
      ]);
    }

    return new Response(JSON.stringify({ ok: true, tenant_id: TENANT_ID, users: DEMO_USERS.map(u => ({ email: u.email, role: u.role })) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
