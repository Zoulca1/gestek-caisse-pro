import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product, Client, Supplier, Sale, StockEntry, Transfer, CompanyInfo } from "./types";
import {
  SEED_PRODUCTS, SEED_CLIENTS, SEED_SUPPLIERS, SEED_ENTRIES, SEED_TRANSFERS,
  COMPANY, generateSeedSales,
} from "./seed";

const KEY = "koffi-data-v1";

interface DataState {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  entries: StockEntry[];
  transfers: Transfer[];
  company: CompanyInfo;
}

interface DataContextValue extends DataState {
  setProducts: (p: Product[]) => void;
  setClients: (c: Client[]) => void;
  setSuppliers: (s: Supplier[]) => void;
  setSales: (s: Sale[]) => void;
  setEntries: (e: StockEntry[]) => void;
  setTransfers: (t: Transfer[]) => void;
  setCompany: (c: CompanyInfo) => void;
  resetAll: () => void;
  exportJSON: () => string;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadInitial(): DataState {
  if (typeof window === "undefined") {
    return {
      products: SEED_PRODUCTS, clients: SEED_CLIENTS, suppliers: SEED_SUPPLIERS,
      sales: [], entries: SEED_ENTRIES, transfers: SEED_TRANSFERS, company: COMPANY,
    };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh: DataState = {
    products: SEED_PRODUCTS,
    clients: SEED_CLIENTS,
    suppliers: SEED_SUPPLIERS,
    sales: generateSeedSales(),
    entries: SEED_ENTRIES,
    transfers: SEED_TRANSFERS,
    company: COMPANY,
  };
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(() => ({
    products: SEED_PRODUCTS, clients: SEED_CLIENTS, suppliers: SEED_SUPPLIERS,
    sales: [], entries: SEED_ENTRIES, transfers: SEED_TRANSFERS, company: COMPANY,
  }));
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
