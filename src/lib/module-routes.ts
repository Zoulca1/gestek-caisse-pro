import type { ModuleKey } from "@/lib/tenant";
import {
  LayoutDashboard, ShoppingCart, Package, Truck, ArrowRightLeft, Users, Building2,
  BarChart3, Calculator, FileText, Users2, Settings, type LucideIcon,
} from "lucide-react";

export interface ModuleNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  module: ModuleKey | null; // null = always visible
}

/** Sidebar items for the cloud SaaS (path-prefixed by /workspace). */
export const CLOUD_NAV: ModuleNavItem[] = [
  { to: "/workspace/dashboard", label: "Tableau de bord", icon: LayoutDashboard, module: null },
  { to: "/workspace/ventes", label: "Ventes", icon: ShoppingCart, module: "ventes" },
  { to: "/workspace/devis", label: "Devis", icon: FileText, module: "devis" },
  { to: "/workspace/produits", label: "Produits & stock", icon: Package, module: "stock" },
  { to: "/workspace/entrees", label: "Entrées de stock", icon: Truck, module: "stock" },
  { to: "/workspace/transferts", label: "Transferts", icon: ArrowRightLeft, module: "transferts" },
  { to: "/workspace/clients", label: "Clients", icon: Users, module: "clients" },
  { to: "/workspace/fournisseurs", label: "Fournisseurs", icon: Building2, module: "fournisseurs" },
  { to: "/workspace/employes", label: "Employés", icon: Users2, module: "employes" },
  { to: "/workspace/comptabilite", label: "Comptabilité", icon: Calculator, module: "comptabilite" },
  { to: "/workspace/rapports", label: "Rapports", icon: BarChart3, module: "rapports" },
  { to: "/workspace/parametres", label: "Paramètres", icon: Settings, module: null },
];

/** Map a workspace path to the module it requires. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const item = CLOUD_NAV.find((n) => pathname.startsWith(n.to));
  return item?.module ?? null;
}
