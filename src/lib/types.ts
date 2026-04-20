export type Role = "admin" | "vendeur" | "stock";

export interface User {
  username: string;
  role: Role;
  name: string;
}

export interface Product {
  id: string;
  emoji: string;
  name: string;
  ref: string;
  barcode: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stockByStore: Record<string, number>;
  threshold: number;
  expiry: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  city: string;
  totalPurchases: number;
  credit: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  ordersCount: number;
  totalBought: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  buyPrice: number;
}

export interface Sale {
  id: string;
  number: string;
  date: string;
  clientId: string | null;
  clientName: string;
  items: SaleItem[];
  total: number;
  profit: number;
  payment: "Espèces" | "Orange Money" | "Wave" | "MTN MoMo" | "Crédit client";
}

export interface StockEntry {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  qty: number;
  unitBuyPrice: number;
  expiry: string;
}

export interface Transfer {
  id: string;
  number: string;
  date: string;
  fromStore: string;
  toStore: string;
  productId: string;
  productName: string;
  qty: number;
}

export interface Store {
  id: string;
  name: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  rccm: string;
  cc: string;
  monthlyGoal?: number;
}

/* ============== Comptabilité ============== */
export type ExpenseCategory =
  | "Loyer" | "Salaires" | "Électricité" | "Eau" | "Internet"
  | "Transport" | "Achat marchandise" | "Taxes" | "Autre";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  createdBy: string;
}

/* ============== Clôture caisse ============== */
export interface DailyClosing {
  id: string;
  number: string;
  date: string;
  cashier: string;
  salesCount: number;
  byPayment: Record<string, number>;
  total: number;
  profit: number;
  unitsSold: number;
  clientsServed: number;
  cashCounted: number;
  cashSystem: number;
  diff: number;
  note: string;
}

/* ============== Dettes fournisseurs ============== */
export interface SupplierDebt {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  purchaseDate: string;
  dueDate: string;
  description: string;
  status: "open" | "paid";
  paidAt?: string;
  paidAmount?: number;
}

/* ============== Devis ============== */
export type QuoteStatus = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Converti";

export interface QuoteLine {
  productId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  discount: number; // %
}

export interface Quote {
  id: string;
  number: string;
  date: string;
  validity: string;
  clientId: string | null;
  clientName: string;
  lines: QuoteLine[];
  globalDiscount: number;
  total: number;
  notes: string;
  status: QuoteStatus;
}

/* ============== Employés / Salaires ============== */
export type EmployeePosition =
  | "Caissier" | "Vendeur" | "Magasinier" | "Livreur"
  | "Comptable" | "Gérant" | "Autre";

export interface Employee {
  id: string;
  name: string;
  position: EmployeePosition;
  phone: string;
  baseSalary: number;
  hireDate: string;
  idNumber?: string;
  active: boolean;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  reason: string;
  monthKey: string; // "2025-04"
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  monthKey: string;
  base: number;
  advances: number;
  bonus: number;
  net: number;
  paid: boolean;
  paidAt?: string;
  method?: "Espèces" | "Mobile Money";
}
