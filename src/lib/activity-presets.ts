import type { Database } from "@/integrations/supabase/types";

export type ActivityType = Database["public"]["Enums"]["activity_type"];
export type ModuleKey = Database["public"]["Enums"]["module_key"];

export interface ActivityPreset {
  id: ActivityType;
  emoji: string;
  name: string;
  description: string;
  defaultModules: ModuleKey[];
}

export const ALL_MODULES: { key: ModuleKey; label: string; description: string; emoji: string }[] = [
  { key: "ventes", label: "Ventes & Caisse", description: "Encaissement, reçus, multi-paiement", emoji: "🛒" },
  { key: "stock", label: "Stock & Produits", description: "Catalogue, ruptures, péremption", emoji: "📦" },
  { key: "clients", label: "Clients", description: "Fichier clients, crédits, fidélité", emoji: "👥" },
  { key: "fournisseurs", label: "Fournisseurs", description: "Achats, dettes fournisseurs", emoji: "🏭" },
  { key: "devis", label: "Devis", description: "Devis professionnels, conversion en facture", emoji: "📄" },
  { key: "comptabilite", label: "Comptabilité", description: "Dépenses, clôtures, rapports", emoji: "🧮" },
  { key: "employes", label: "Employés & Salaires", description: "Paie, bulletins PDF, avances", emoji: "👔" },
  { key: "conges", label: "Congés & Absences", description: "Demandes, calendrier, déductions", emoji: "🌴" },
  { key: "transferts", label: "Transferts magasins", description: "Mouvements entre points de vente", emoji: "🔁" },
  { key: "rapports", label: "Rapports avancés", description: "Statistiques, graphiques, exports", emoji: "📊" },
];

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  {
    id: "pharmacie",
    emoji: "💊",
    name: "Pharmacie",
    description: "Suivi DLC, ordonnances, garde",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "comptabilite", "rapports"],
  },
  {
    id: "restaurant",
    emoji: "🍽️",
    name: "Restaurant",
    description: "Tables, menus, ingrédients",
    defaultModules: ["ventes", "stock", "employes", "conges", "comptabilite"],
  },
  {
    id: "boutique_generale",
    emoji: "🛒",
    name: "Boutique générale",
    description: "Multi-rayons, polyvalent",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "transferts", "comptabilite"],
  },
  {
    id: "quincaillerie",
    emoji: "🔧",
    name: "Quincaillerie",
    description: "Références techniques, lots",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "devis", "comptabilite"],
  },
  {
    id: "cosmetique",
    emoji: "💄",
    name: "Cosmétique",
    description: "Lots, péremption, marques",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "comptabilite"],
  },
  {
    id: "alimentaire",
    emoji: "🥘",
    name: "Alimentaire",
    description: "Frais, surgelés, traçabilité",
    defaultModules: ["ventes", "stock", "fournisseurs", "transferts", "comptabilite"],
  },
  {
    id: "electronique",
    emoji: "📱",
    name: "Électronique",
    description: "SAV, garanties, références",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "devis", "comptabilite", "rapports"],
  },
  {
    id: "mode",
    emoji: "👗",
    name: "Mode & Textile",
    description: "Tailles, couleurs, collections",
    defaultModules: ["ventes", "stock", "clients", "fournisseurs", "comptabilite"],
  },
  {
    id: "autre",
    emoji: "🏪",
    name: "Autre activité",
    description: "Configuration personnalisée",
    defaultModules: ["ventes", "stock", "clients", "comptabilite"],
  },
];

export function getPreset(activity: ActivityType): ActivityPreset {
  return ACTIVITY_PRESETS.find((p) => p.id === activity) ?? ACTIVITY_PRESETS[2];
}
