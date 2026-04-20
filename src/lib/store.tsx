import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Product, Client, Supplier, Sale, StockEntry, Transfer, CompanyInfo,
  Expense, DailyClosing, SupplierDebt, Quote, Employee, SalaryAdvance, SalaryPayment,
} from "./types";
import {
  SEED_PRODUCTS, SEED_CLIENTS, SEED_SUPPLIERS, SEED_ENTRIES, SEED_TRANSFERS,
  COMPANY, generateSeedSales, generateSeedExpenses, SEED_SUPPLIER_DEBTS,
  SEED_QUOTES, SEED_EMPLOYEES, SEED_ADVANCES, SEED_SALARY_PAYMENTS,
} from "./seed";

const KEY = "koffi-data-v2";

interface DataState {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  entries: StockEntry[];
  transfers: Transfer[];
  company: CompanyInfo;
  expenses: Expense[];
  closings: DailyClosing[];
  supplierDebts: SupplierDebt[];
  quotes: Quote[];
  employees: Employee[];
  advances: SalaryAdvance[];
  salaryPayments: SalaryPayment[];
}

interface DataContextValue extends DataState {
  setProducts: (p: Product[]) => void;
  setClients: (c: Client[]) => void;
  setSuppliers: (s: Supplier[]) => void;
  setSales: (s: Sale[]) => void;
  setEntries: (e: StockEntry[]) => void;
  setTransfers: (t: Transfer[]) => void;
  setCompany: (c: CompanyInfo) => void;
  setExpenses: (e: Expense[]) => void;
  setClosings: (c: DailyClosing[]) => void;
  setSupplierDebts: (d: SupplierDebt[]) => void;
  setQuotes: (q: Quote[]) => void;
  setEmployees: (e: Employee[]) => void;
  setAdvances: (a: SalaryAdvance[]) => void;
  setSalaryPayments: (s: SalaryPayment[]) => void;
  resetAll: () => void;
  exportJSON: () => string;
}

const DataContext = createContext<DataContextValue | null>(null);

function freshState(): DataState {
  return {
    products: SEED_PRODUCTS,
    clients: SEED_CLIENTS,
    suppliers: SEED_SUPPLIERS,
    sales: generateSeedSales(),
    entries: SEED_ENTRIES,
    transfers: SEED_TRANSFERS,
    company: COMPANY,
    expenses: generateSeedExpenses(),
    closings: [],
    supplierDebts: SEED_SUPPLIER_DEBTS,
    quotes: SEED_QUOTES,
    employees: SEED_EMPLOYEES,
    advances: SEED_ADVANCES,
    salaryPayments: SEED_SALARY_PAYMENTS,
  };
}

function emptyState(): DataState {
  return {
    products: SEED_PRODUCTS, clients: SEED_CLIENTS, suppliers: SEED_SUPPLIERS,
    sales: [], entries: SEED_ENTRIES, transfers: SEED_TRANSFERS, company: COMPANY,
    expenses: [], closings: [], supplierDebts: [], quotes: [],
    employees: [], advances: [], salaryPayments: [],
  };
}

function loadInitial(): DataState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // merge defaults pour les nouvelles clés
      return { ...freshState(), ...parsed };
    }
  } catch {}
  const fresh = freshState();
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
  return fresh;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  const value: DataContextValue = {
    ...state,
    setProducts: (products) => setState((s) => ({ ...s, products })),
    setClients: (clients) => setState((s) => ({ ...s, clients })),
    setSuppliers: (suppliers) => setState((s) => ({ ...s, suppliers })),
    setSales: (sales) => setState((s) => ({ ...s, sales })),
    setEntries: (entries) => setState((s) => ({ ...s, entries })),
    setTransfers: (transfers) => setState((s) => ({ ...s, transfers })),
    setCompany: (company) => setState((s) => ({ ...s, company })),
    setExpenses: (expenses) => setState((s) => ({ ...s, expenses })),
    setClosings: (closings) => setState((s) => ({ ...s, closings })),
    setSupplierDebts: (supplierDebts) => setState((s) => ({ ...s, supplierDebts })),
    setQuotes: (quotes) => setState((s) => ({ ...s, quotes })),
    setEmployees: (employees) => setState((s) => ({ ...s, employees })),
    setAdvances: (advances) => setState((s) => ({ ...s, advances })),
    setSalaryPayments: (salaryPayments) => setState((s) => ({ ...s, salaryPayments })),
    resetAll: () => {
      try { localStorage.removeItem(KEY); } catch {}
      setState(loadInitial());
    },
    exportJSON: () => JSON.stringify(state, null, 2),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
