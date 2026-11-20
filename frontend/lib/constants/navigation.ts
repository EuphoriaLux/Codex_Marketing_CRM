// Single source of truth for the hub's navigation: the sidebar renders it and
// the quick search (Ctrl+K) searches it.

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Extra words the quick search should match (synonyms, DE/EN terms). */
  keywords?: string;
};

export type NavSection = { title: string; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: "📊", keywords: "accueil home dashboard aujourd'hui" },
      { href: "/analytics", label: "Analytics", icon: "📈", keywords: "statistiques kpi trafic ga4 search console" },
      { href: "/planning", label: "Planning", icon: "🗓️", keywords: "calendrier agenda kalender" },
      { href: "/team", label: "Équipe & Coachs", icon: "👥", keywords: "team staff coach mitarbeiter" },
    ],
  },
  {
    title: "Événements & Billetterie",
    items: [
      { href: "/events/coaches", label: "Événements & Coachs", icon: "🙋", keywords: "events disponibilités staffing veranstaltung" },
      { href: "/events/cancellations", label: "Annulations & Crédits", icon: "🎟️", keywords: "remboursement refund crédit storno" },
    ],
  },
  {
    title: "Opérations & CRM",
    items: [
      { href: "/locations", label: "Partenaires", icon: "🤝", keywords: "lieux venues locations offres partner bars restaurants" },
      { href: "/whatsapp", label: "WhatsApp Support", icon: "💬", keywords: "messages inbox support chat" },
      { href: "/partnership-admin", label: "Partenariats", icon: "📨", keywords: "demandes partenariat leads" },
      { href: "/calculator", label: "Calculateur Marges", icon: "🧮", keywords: "simulateur revenus marge rechner" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/marketing/social", label: "Planification Réseaux", icon: "📣", keywords: "social instagram facebook linkedin buffer posts" },
      { href: "/marketing/publications", label: "Publications & Blog", icon: "📢", keywords: "annonces devlog articles news" },
    ],
  },
  {
    title: "FinOps & Comptabilité",
    items: [
      { href: "/accounting", label: "Comptabilité Générale", icon: "💰", keywords: "paiements finance buchhaltung sumup" },
      { href: "/accounting#payroll", label: "Salaires & Dépenses", icon: "💼", keywords: "payroll salaires dépenses gehalt" },
    ],
  },
  {
    title: "Compte",
    items: [{ href: "/settings", label: "Mon profil", icon: "⚙️", keywords: "paramètres settings profil einstellungen" }],
  },
];

export function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** True when `pathname` is the entry's page or one of its sub-pages. */
export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  // Anchor links (#payroll) point inside another entry's page and never take
  // the highlight from it.
  if (item.href.includes("#")) return false;
  const path = normalizePath(pathname);
  return path === item.href || path.startsWith(`${item.href}/`);
}
