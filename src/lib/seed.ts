import type {
  Product, Client, Supplier, Sale, SaleItem, StockEntry, Transfer, Store, CompanyInfo,
  Expense, SupplierDebt, Quote, Employee, SalaryAdvance, SalaryPayment, Leave,
} from "./types";

export const STORES: Store[] = [
  { id: "yopougon", name: "Dépôt Principal Yopougon" },
  { id: "selmer", name: "Boutique Selmer Marché" },
  { id: "abobo", name: "Point de vente Abobo" },
];

export const COMPANY: CompanyInfo = {
  name: "Épicerie Moderne KOFFI",
  address: "Boulevard Latrille, Cocody — Abidjan",
  phone: "+225 07 08 12 34 56",
  email: "contact@epicerie-koffi.ci",
  rccm: "CI-ABJ-2019-B-12345",
  cc: "CC-1903456 P",
  monthlyGoal: 3500000,
};

const today = new Date();
const addDays = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString();
};

export const SEED_PRODUCTS: Product[] = [
  { id: "p1", emoji: "🛢️", name: "Huile Dinor 1L", ref: "DIN-1L", barcode: "6001234567890", category: "Huiles", buyPrice: 1100, sellPrice: 1400, stockByStore: { yopougon: 48, selmer: 22, abobo: 14 }, threshold: 20, expiry: addDays(180) },
  { id: "p2", emoji: "🍚", name: "Riz Uncle Ben's 5kg", ref: "UNC-5KG", barcode: "6002234567891", category: "Céréales", buyPrice: 5800, sellPrice: 7200, stockByStore: { yopougon: 30, selmer: 12, abobo: 8 }, threshold: 10, expiry: addDays(300) },
  { id: "p3", emoji: "🧂", name: "Sucre Princier 1kg", ref: "SUC-1KG", barcode: "6003234567892", category: "Épicerie sèche", buyPrice: 650, sellPrice: 850, stockByStore: { yopougon: 80, selmer: 40, abobo: 25 }, threshold: 30, expiry: addDays(400) },
  { id: "p4", emoji: "🌾", name: "Farine de blé 1kg", ref: "FAR-1KG", barcode: "6004234567893", category: "Épicerie sèche", buyPrice: 550, sellPrice: 750, stockByStore: { yopougon: 60, selmer: 30, abobo: 20 }, threshold: 25, expiry: addDays(120) },
  { id: "p5", emoji: "🍅", name: "Tomate concentrée 70g", ref: "TOM-70", barcode: "6005234567894", category: "Conserves", buyPrice: 180, sellPrice: 250, stockByStore: { yopougon: 120, selmer: 60, abobo: 40 }, threshold: 50, expiry: addDays(220) },
  { id: "p6", emoji: "🥛", name: "Lait Nido 400g", ref: "NID-400", barcode: "6006234567895", category: "Produits laitiers", buyPrice: 2200, sellPrice: 2800, stockByStore: { yopougon: 25, selmer: 10, abobo: 6 }, threshold: 8, expiry: addDays(95) },
  { id: "p7", emoji: "🥤", name: "Coca-Cola 1.5L", ref: "COC-15", barcode: "6007234567896", category: "Boissons", buyPrice: 750, sellPrice: 1000, stockByStore: { yopougon: 90, selmer: 45, abobo: 30 }, threshold: 30, expiry: addDays(150) },
  { id: "p8", emoji: "💧", name: "Eau minérale Awa 1.5L", ref: "AWA-15", barcode: "6008234567897", category: "Boissons", buyPrice: 200, sellPrice: 350, stockByStore: { yopougon: 200, selmer: 100, abobo: 70 }, threshold: 50, expiry: addDays(250) },
  { id: "p9", emoji: "🍺", name: "Bière Castel 65cl", ref: "CAS-65", barcode: "6009234567898", category: "Boissons", buyPrice: 600, sellPrice: 900, stockByStore: { yopougon: 60, selmer: 36, abobo: 24 }, threshold: 24, expiry: addDays(110) },
  { id: "p10", emoji: "🐟", name: "Sardines à l'huile 125g", ref: "SAR-125", barcode: "6010234567899", category: "Conserves", buyPrice: 450, sellPrice: 650, stockByStore: { yopougon: 80, selmer: 30, abobo: 18 }, threshold: 25, expiry: addDays(500) },
  { id: "p11", emoji: "🧼", name: "Savon OMO 1kg", ref: "OMO-1KG", barcode: "6011234567800", category: "Hygiène", buyPrice: 1400, sellPrice: 1800, stockByStore: { yopougon: 40, selmer: 18, abobo: 12 }, threshold: 15, expiry: addDays(700) },
  { id: "p12", emoji: "🪥", name: "Dentifrice Colgate 100ml", ref: "COL-100", barcode: "6012234567801", category: "Hygiène", buyPrice: 700, sellPrice: 1000, stockByStore: { yopougon: 35, selmer: 15, abobo: 10 }, threshold: 12, expiry: addDays(550) },
  { id: "p13", emoji: "🧂", name: "Sel iodé 500g", ref: "SEL-500", barcode: "6013234567802", category: "Épicerie sèche", buyPrice: 150, sellPrice: 250, stockByStore: { yopougon: 100, selmer: 50, abobo: 30 }, threshold: 30, expiry: addDays(800) },
  { id: "p14", emoji: "🍝", name: "Pâtes Panzani 500g", ref: "PAN-500", barcode: "6014234567803", category: "Céréales", buyPrice: 600, sellPrice: 850, stockByStore: { yopougon: 50, selmer: 25, abobo: 16 }, threshold: 20, expiry: addDays(360) },
  { id: "p15", emoji: "☕", name: "Café Nescafé 100g", ref: "NES-100", barcode: "6015234567804", category: "Boissons chaudes", buyPrice: 2400, sellPrice: 3100, stockByStore: { yopougon: 18, selmer: 8, abobo: 5 }, threshold: 8, expiry: addDays(420) },
  { id: "p16", emoji: "🍪", name: "Biscuits Oreo 137g", ref: "ORE-137", barcode: "6016234567805", category: "Snacks", buyPrice: 700, sellPrice: 950, stockByStore: { yopougon: 45, selmer: 20, abobo: 14 }, threshold: 15, expiry: addDays(20) },
  { id: "p17", emoji: "🧃", name: "Jus Tampico 1L", ref: "TAM-1L", barcode: "6017234567806", category: "Boissons", buyPrice: 600, sellPrice: 850, stockByStore: { yopougon: 40, selmer: 20, abobo: 12 }, threshold: 15, expiry: addDays(80) },
  { id: "p18", emoji: "🥚", name: "Mayonnaise Amora 175ml", ref: "AMO-175", barcode: "6018234567807", category: "Condiments", buyPrice: 1300, sellPrice: 1700, stockByStore: { yopougon: 22, selmer: 10, abobo: 6 }, threshold: 10, expiry: addDays(140) },
  { id: "p19", emoji: "🔥", name: "Allumettes (boîte de 10)", ref: "ALL-10", barcode: "6019234567808", category: "Divers", buyPrice: 200, sellPrice: 300, stockByStore: { yopougon: 60, selmer: 30, abobo: 20 }, threshold: 20, expiry: addDays(900) },
  { id: "p20", emoji: "🧈", name: "Beurre Président 250g", ref: "PRE-250", barcode: "6020234567809", category: "Produits laitiers", buyPrice: 1800, sellPrice: 2400, stockByStore: { yopougon: 2, selmer: 1, abobo: 0 }, threshold: 10, expiry: addDays(8) },
  { id: "p21", emoji: "🍫", name: "Chocolat Kinder 100g", ref: "KIN-100", barcode: "6021234567810", category: "Snacks", buyPrice: 1100, sellPrice: 1500, stockByStore: { yopougon: 0, selmer: 0, abobo: 0 }, threshold: 12, expiry: addDays(60) },
];

export const SEED_CLIENTS: Client[] = [
  { id: "c1", name: "Aya Konan", phone: "+22507111122", city: "Cocody", totalPurchases: 145000, credit: 0 },
  { id: "c2", name: "Kouadio N'Guessan", phone: "+22507222233", city: "Yopougon", totalPurchases: 320000, credit: 25000 },
  { id: "c3", name: "Aminata Touré", phone: "+22507333344", city: "Abobo", totalPurchases: 89000, credit: 0 },
  { id: "c4", name: "Mariam Bamba", phone: "+22507444455", city: "Treichville", totalPurchases: 215000, credit: 18500 },
  { id: "c5", name: "Yao Brou", phone: "+22507555566", city: "Marcory", totalPurchases: 67000, credit: 0 },
  { id: "c6", name: "Fatou Diallo", phone: "+22507666677", city: "Adjamé", totalPurchases: 412000, credit: 42000 },
  { id: "c7", name: "Ibrahim Coulibaly", phone: "+22507777788", city: "Plateau", totalPurchases: 178000, credit: 0 },
];

export const SEED_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "SODICAF", phone: "+22521251010", specialty: "Café & boissons chaudes", ordersCount: 14, totalBought: 2840000 },
  { id: "s2", name: "CDCI Abidjan", phone: "+22521252020", specialty: "Distribution générale", ordersCount: 28, totalBought: 6120000 },
  { id: "s3", name: "NESTLÉ CI", phone: "+22521253030", specialty: "Produits laitiers", ordersCount: 11, totalBought: 1980000 },
  { id: "s4", name: "Brasseries Abidjan", phone: "+22521254040", specialty: "Boissons & bières", ordersCount: 22, totalBought: 4350000 },
  { id: "s5", name: "UNILEVER CI", phone: "+22521255050", specialty: "Hygiène & entretien", ordersCount: 9, totalBought: 1240000 },
];

const PAYMENTS: Sale["payment"][] = ["Espèces", "Orange Money", "Wave", "MTN MoMo", "Crédit client"];

export function generateSeedSales(): Sale[] {
  const sales: Sale[] = [];
  let counter = 1;
  for (let d = 30; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    const nb = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < nb; i++) {
      const items: SaleItem[] = [];
      const nbItems = 1 + Math.floor(Math.random() * 4);
      for (let j = 0; j < nbItems; j++) {
        const p = SEED_PRODUCTS[Math.floor(Math.random() * 19)];
        const qty = 1 + Math.floor(Math.random() * 4);
        items.push({ productId: p.id, name: p.name, qty, unitPrice: p.sellPrice, buyPrice: p.buyPrice });
      }
      const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const profit = items.reduce((s, it) => s + it.qty * (it.unitPrice - it.buyPrice), 0);
      const client = SEED_CLIENTS[Math.floor(Math.random() * SEED_CLIENTS.length)];
      const date = new Date(day);
      date.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      sales.push({
        id: "sale-" + counter,
        number: "V-" + String(counter).padStart(4, "0"),
        date: date.toISOString(),
        clientId: Math.random() > 0.4 ? client.id : null,
        clientName: Math.random() > 0.4 ? client.name : "Client passant",
        items, total, profit,
        payment: PAYMENTS[Math.floor(Math.random() * PAYMENTS.length)],
      });
      counter++;
    }
  }
  return sales;
}

export const SEED_ENTRIES: StockEntry[] = [
  { id: "e1", number: "BON-001", date: addDays(-10), supplierId: "s2", supplierName: "CDCI Abidjan", productId: "p1", productName: "Huile Dinor 1L", qty: 60, unitBuyPrice: 1100, expiry: addDays(180) },
  { id: "e2", number: "BON-002", date: addDays(-7), supplierId: "s4", supplierName: "Brasseries Abidjan", productId: "p9", productName: "Bière Castel 65cl", qty: 120, unitBuyPrice: 600, expiry: addDays(110) },
  { id: "e3", number: "BON-003", date: addDays(-4), supplierId: "s3", supplierName: "NESTLÉ CI", productId: "p6", productName: "Lait Nido 400g", qty: 40, unitBuyPrice: 2200, expiry: addDays(95) },
  { id: "e4", number: "BON-004", date: addDays(-2), supplierId: "s5", supplierName: "UNILEVER CI", productId: "p11", productName: "Savon OMO 1kg", qty: 50, unitBuyPrice: 1400, expiry: addDays(700) },
];

export const SEED_TRANSFERS: Transfer[] = [
  { id: "t1", number: "TR-001", date: addDays(-5), fromStore: "yopougon", toStore: "selmer", productId: "p1", productName: "Huile Dinor 1L", qty: 20 },
  { id: "t2", number: "TR-002", date: addDays(-3), fromStore: "yopougon", toStore: "abobo", productId: "p7", productName: "Coca-Cola 1.5L", qty: 30 },
];

/* ===== Comptabilité ===== */
export function generateSeedExpenses(): Expense[] {
  const out: Expense[] = [];
  const samples: Array<[Expense["category"], string, number]> = [
    ["Loyer", "Loyer mensuel boutique Selmer", 250000],
    ["Salaires", "Acompte caissière", 50000],
    ["Électricité", "Facture CIE mai", 78000],
    ["Eau", "Facture SODECI", 18500],
    ["Internet", "Abonnement Orange Pro", 35000],
    ["Transport", "Carburant livraison", 22000],
    ["Achat marchandise", "Réassort huile + sucre", 320000],
    ["Taxes", "Patente trimestre", 45000],
    ["Autre", "Réparation frigo", 28000],
    ["Transport", "Course taxi marché Adjamé", 7500],
  ];
  samples.forEach((s, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2);
    out.push({
      id: "exp-" + (i + 1),
      date: d.toISOString(),
      category: s[0],
      description: s[1],
      amount: s[2],
      createdBy: "Konan Admin",
    });
  });
  return out;
}

/* ===== Dettes fournisseurs ===== */
export const SEED_SUPPLIER_DEBTS: SupplierDebt[] = [
  { id: "d1", supplierId: "s2", supplierName: "CDCI Abidjan", amount: 480000, purchaseDate: addDays(-10), dueDate: addDays(20), description: "Réassort général mai", status: "open" },
  { id: "d2", supplierId: "s4", supplierName: "Brasseries Abidjan", amount: 320000, purchaseDate: addDays(-18), dueDate: addDays(7), description: "Casiers Castel 65cl x 50", status: "open" },
  { id: "d3", supplierId: "s3", supplierName: "NESTLÉ CI", amount: 180000, purchaseDate: addDays(-25), dueDate: addDays(-3), description: "Lait Nido 400g x 80", status: "open" },
  { id: "d4", supplierId: "s5", supplierName: "UNILEVER CI", amount: 140000, purchaseDate: addDays(-6), dueDate: addDays(40), description: "OMO + Colgate", status: "open" },
  { id: "d5", supplierId: "s1", supplierName: "SODICAF", amount: 95000, purchaseDate: addDays(-30), dueDate: addDays(-8), description: "Café Nescafé carton x 5", status: "open" },
];

/* ===== Devis ===== */
export const SEED_QUOTES: Quote[] = [
  {
    id: "q1", number: "DEV-0001", date: addDays(-5), validity: addDays(25),
    clientId: "c1", clientName: "Aya Konan",
    lines: [
      { productId: "p1", name: "Huile Dinor 1L", qty: 12, unitPrice: 1400, discount: 0 },
      { productId: "p3", name: "Sucre Princier 1kg", qty: 20, unitPrice: 850, discount: 5 },
    ],
    globalDiscount: 0, total: 12 * 1400 + 20 * 850 * 0.95,
    notes: "Livraison gratuite à Cocody.", status: "Envoyé",
  },
  {
    id: "q2", number: "DEV-0002", date: addDays(-12), validity: addDays(18),
    clientId: "c6", clientName: "Fatou Diallo",
    lines: [
      { productId: "p2", name: "Riz Uncle Ben's 5kg", qty: 6, unitPrice: 7200, discount: 0 },
      { productId: "p7", name: "Coca-Cola 1.5L", qty: 24, unitPrice: 1000, discount: 0 },
    ],
    globalDiscount: 5, total: (6 * 7200 + 24 * 1000) * 0.95,
    notes: "Validité 30 jours.", status: "Accepté",
  },
  {
    id: "q3", number: "DEV-0003", date: addDays(-2), validity: addDays(28),
    clientId: null, clientName: "Restaurant Le Baoulé",
    lines: [
      { productId: "p10", name: "Sardines à l'huile 125g", qty: 50, unitPrice: 650, discount: 10 },
    ],
    globalDiscount: 0, total: 50 * 650 * 0.9,
    notes: "Paiement à 15 jours.", status: "Brouillon",
  },
];

/* ===== Employés ===== */
export const SEED_EMPLOYEES: Employee[] = [
  { id: "em1", name: "KOFFI Emmanuel", position: "Gérant", phone: "+22507100001", baseSalary: 150000, hireDate: addDays(-720), idNumber: "CI001-2019", active: true },
  { id: "em2", name: "Adjoua Marie", position: "Caissier", phone: "+22507100002", baseSalary: 85000, hireDate: addDays(-540), idNumber: "CI002-2020", active: true },
  { id: "em3", name: "Koné Ibrahim", position: "Magasinier", phone: "+22507100003", baseSalary: 75000, hireDate: addDays(-400), active: true },
  { id: "em4", name: "Ouédraogo Paul", position: "Livreur", phone: "+22507100004", baseSalary: 65000, hireDate: addDays(-280), active: true },
  { id: "em5", name: "Diabaté Fatou", position: "Vendeur", phone: "+22507100005", baseSalary: 70000, hireDate: addDays(-160), active: true },
];

const monthKey = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const curKey = monthKey(today);
const prevDate = new Date(today); prevDate.setMonth(prevDate.getMonth() - 1);
const prevKey = monthKey(prevDate);

export const SEED_ADVANCES: SalaryAdvance[] = [
  { id: "av1", employeeId: "em2", amount: 20000, date: addDays(-10), reason: "Frais médicaux", monthKey: curKey },
  { id: "av2", employeeId: "em4", amount: 15000, date: addDays(-5), reason: "Avance carburant", monthKey: curKey },
];

export const SEED_SALARY_PAYMENTS: SalaryPayment[] = SEED_EMPLOYEES.map((e) => ({
  id: "sal-prev-" + e.id,
  employeeId: e.id,
  employeeName: e.name,
  monthKey: prevKey,
  base: e.baseSalary,
  advances: 0,
  bonus: 0,
  deduction: 0,
  unpaidDays: 0,
  net: e.baseSalary,
  paid: true,
  paidAt: addDays(-5),
  method: "Mobile Money",
}));

/* ===== Congés & absences ===== */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const mkDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return isoDay(d);
};
const diffDays = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;

const leaveEntries: Array<Omit<Leave, "id" | "days" | "createdAt" | "employeeName">> = [
  // Congé payé à venir pour le gérant
  { employeeId: "em1", type: "Congé payé", startDate: mkDate(10), endDate: mkDate(14), reason: "Congé annuel", status: "Approuvé" },
  // Maladie récente — caissière (pas de déduction)
  { employeeId: "em2", type: "Maladie", startDate: mkDate(-6), endDate: mkDate(-4), reason: "Arrêt maladie — certificat médical", status: "Approuvé" },
  // Absence non justifiée — livreur (IMPACT SALAIRE)
  { employeeId: "em4", type: "Absence non justifiée", startDate: mkDate(-3), endDate: mkDate(-3), reason: "Absence non signalée", status: "Approuvé" },
  // Congé sans solde demandé — magasinier (IMPACT SALAIRE)
  { employeeId: "em3", type: "Congé sans solde", startDate: mkDate(5), endDate: mkDate(7), reason: "Affaires familiales", status: "En attente" },
  // Récupération — vendeuse
  { employeeId: "em5", type: "Récupération", startDate: mkDate(-1), endDate: mkDate(-1), reason: "Récup heures supp dimanche", status: "Approuvé" },
];

export const SEED_LEAVES: Leave[] = leaveEntries.map((l, i) => {
  const emp = SEED_EMPLOYEES.find((e) => e.id === l.employeeId)!;
  return {
    id: "lv" + (i + 1),
    employeeName: emp.name,
    days: diffDays(l.startDate, l.endDate),
    createdAt: addDays(-8 + i),
    ...l,
  };
});

