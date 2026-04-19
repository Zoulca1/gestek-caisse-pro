import type {
  Product, Client, Supplier, Sale, SaleItem, StockEntry, Transfer, Store, CompanyInfo,
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
  // Produits en alerte
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
        items,
        total,
        profit,
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
