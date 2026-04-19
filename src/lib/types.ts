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
  expiry: string; // ISO
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
  date: string; // ISO
  clientId: string | null;
  clientName: string;
  items: SaleItem[];
  total: number;
  profit: number;
  payment: "Espèces" | "Orange Money" | "Wave" | "MTN MoMo" | "Crédit client";
}

export interface StockEntry {
  id: string;
  number: string; // BON-XXX
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
}
