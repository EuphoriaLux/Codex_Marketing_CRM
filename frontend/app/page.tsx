"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type RoleKey = "founder" | "cofounder" | "accountant" | "employee";

type RoleDef = {
  name: string;
  badge: string;
  welcome: string;
  avatar: string;
  modules: string[];
  showRevenue: boolean;
  eventsTitle: string;
  activityTitle: string;
  priorityTitle: string;
};

const ROLES: Record<RoleKey, RoleDef> = {
  founder: {
    name: "Fondateur",
    badge: "🌟 Fondateur · Accès complet",
    welcome: "Bonsoir, Sébastien.",
    avatar: "S",
    modules: ["dashboard", "planning", "team", "requests", "locations", "accounting", "payroll", "calculator", "settings"],
    showRevenue: true,
    eventsTitle: "📅 Prochains événements de l'équipe",
    activityTitle: "⚡ Activité de l'équipe",
    priorityTitle: "🎯 À traiter en priorité",
  },
  cofounder: {
    name: "Co-fondateur",
    badge: "✨ Co-fondateur · Accès complet",
    welcome: "Bonsoir, Romain.",
    avatar: "R",
    modules: ["dashboard", "planning", "team", "requests", "locations", "accounting", "payroll", "calculator", "settings"],
    showRevenue: true,
    eventsTitle: "📅 Prochains événements de l'équipe",
    activityTitle: "⚡ Activité de l'équipe",
    priorityTitle: "🎯 À traiter en priorité",
  },
  accountant: {
    name: "Comptable",
    badge: "📊 Comptable · Finances",
    welcome: "Bonjour, Claire.",
    avatar: "C",
    modules: ["dashboard", "accounting", "payroll", "calculator"],
    showRevenue: true,
    eventsTitle: "📅 Événements à facturer",
    activityTitle: "⚡ Activité financière",
    priorityTitle: "🎯 Factures & paiements à traiter",
  },
  employee: {
    name: "Employé",
    badge: "👤 Employé · Mon espace",
    welcome: "Bonsoir, Julien.",
    avatar: "J",
    modules: ["dashboard", "planning", "requests"],
    showRevenue: false,
    eventsTitle: "📅 Mes prochains shifts",
    activityTitle: "⚡ Mon activité",
    priorityTitle: "🎯 Demandes & disponibilités à confirmer",
  },
};

type QuickTile = {
  key: string;
  ico: string;
  label: string;
  href: string;
};

const QUICK_TILES: QuickTile[] = [
  { key: "dashboard",  ico: "📊", label: "Tableau de bord", href: "/dashboard" },
  { key: "planning",   ico: "🗓️", label: "Planning",        href: "#" },
  { key: "team",       ico: "👥", label: "Équipe",          href: "#" },
  { key: "requests",   ico: "📋", label: "Demandes",        href: "/requests" },
  { key: "locations",  ico: "📍", label: "Lieux",           href: "/locations" },
  { key: "accounting", ico: "💰", label: "Comptabilité",    href: "/accounting" },
  { key: "payroll",    ico: "💼", label: "Salaires",        href: "/accounting" },
  { key: "calculator", ico: "🎟️", label: "Calculator",      href: "/calculator" },
  { key: "settings",   ico: "⚙️", label: "Paramètres",      href: "/settings" },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [roleKey, setRoleKey] = useState<RoleKey>("founder");
  const [menuOpen, setMenuOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);

  const role = ROLES[roleKey];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chipRef.current && !chipRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function fakeLogin() {
    setLoggedIn(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pickRole(next: RoleKey) {
    setRoleKey(next);
    setMenuOpen(false);
  }

  const visibleModulesCount = QUICK_TILES.filter((t) => role.modules.includes(t.key)).length;

  return (
    <div className={styles.root}>
      <div className={styles.scene}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>◆</div>
            <span>Crush Hub</span>
          </div>

          {!loggedIn ? (
            <div className={styles.navRight}>
              <span className={styles.privateChip}>🔒 Espace interne</span>
              <button type="button" className={styles.iconBox} aria-label="Langue">FR</button>
              <button type="button" className={styles.iconBox} aria-label="Thème">🌙</button>
            </div>
          ) : (
            <div className={styles.navRight}>
              <button type="button" className={styles.iconBtn} aria-label="Notifications">
                🔔
                <span className={styles.iconBadge} />
              </button>
              <div
                className={styles.userChip}
                ref={chipRef}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className={styles.avatar}>{role.avatar}</div>
                <div>
                  <div className={styles.userName}>{role.welcome.replace("Bonsoir, ", "").replace("Bonjour, ", "").replace(".", "")}</div>
                  <div className={styles.userRole}>{role.name}</div>
                </div>
                <span className={styles.chevron}>▾</span>

                {menuOpen ? (
                  <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={styles.menuItem}><span>👤</span> Profil</button>
                    <button type="button" className={styles.menuItem}><span>⚙</span> Paramètres</button>
                    <div className={styles.menuDivider} />
                    <div className={styles.menuSection}>🧪 Dev — Changer de rôle</div>
                    {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.menuItem} ${roleKey === key ? styles.menuItemActive : ""}`}
                        onClick={() => pickRole(key)}
                      >
                        <span className={styles.roleRadio} />
                        {ROLES[key].name}
                      </button>
                    ))}
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => { setLoggedIn(false); setMenuOpen(false); }}
                    >
                      <span>🚪</span> Se déconnecter
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </nav>

        {!loggedIn ? (
          <div className={styles.preLogin}>
            <section className={styles.hero}>
              <span className={styles.eyebrow}>
                <span className={styles.dot} /> Accès réservé · équipe Crush.lu
              </span>

              <h1 className={styles.heroTitle}>
                L&apos;espace interne<br />
                <span className={styles.gradient}>de l&apos;équipe<br />Crush.lu.</span>
              </h1>

              <p className={styles.lead}>
                Pilotage, comptabilité et planning d&apos;équipe réunis dans un seul espace
                sécurisé pour les fondateurs, le comptable et les employés.
              </p>

              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <div className={styles.statNum}>42</div>
                  <div className={styles.statLabel}>Événements à venir</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNum}>6</div>
                  <div className={styles.statLabel}>Membres de l&apos;équipe</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNum}>€14k</div>
                  <div className={styles.statLabel}>En attente paiement</div>
                </div>
              </div>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}><span className={styles.check}>✓</span> Pilotage global pour les fondateurs</li>
                <li className={styles.featureItem}><span className={styles.check}>✓</span> Espace comptable dédié (paiements, salaires, TVA)</li>
                <li className={styles.featureItem}><span className={styles.check}>✓</span> Planning d&apos;équipe & disponibilités des employés</li>
                <li className={styles.featureItem}><span className={styles.check}>✓</span> Accès cloisonné par rôle</li>
              </ul>
            </section>

            <aside className={styles.loginPanel}>
              <h2 className={styles.loginTitle}>Connexion équipe</h2>
              <p className={styles.loginSub}>Identifiez-vous avec votre compte Crush.lu.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fakeLogin();
                }}
              >
                <div className={styles.field}>
                  <label htmlFor="email">Email professionnel</label>
                  <input id="email" type="email" placeholder="prenom@crush.lu" autoComplete="email" />
                </div>

                <div className={styles.field}>
                  <label htmlFor="password">Mot de passe</label>
                  <input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
                </div>

                <button type="submit" className={styles.btnPrimary}>
                  Accéder à mon espace →
                </button>
              </form>

              <div className={styles.divider}>ou</div>

              <button type="button" className={styles.btnSso} onClick={fakeLogin}>
                ⚡ Continuer avec Crush.lu
              </button>

              <div className={styles.roleHint}>
                Votre interface s&apos;adapte à votre poste<br />
                (Fondateur · Co-fondateur · Comptable · Employé)
              </div>
            </aside>
          </div>
        ) : (
          <div className={styles.postLogin}>
            <div className={styles.topbar}>
              <div className={styles.search}>
                <span>🔍</span>
                <span>Rechercher un client, un événement, une facture...</span>
              </div>
              <div className={styles.topbarRight}>
                <span className={styles.sessionBadge}>🔒 Session sécurisée</span>
              </div>
            </div>

            <div className={styles.bento}>
              <div className={`${styles.card} ${styles.cardWelcome} ${styles.cardGlow}`}>
                <div className={styles.cardLabel}>Bienvenue</div>
                <div className={styles.welcomeGreeting}>{role.welcome}</div>
                <div className={styles.welcomeSub}>Dernière connexion il y a 2h.</div>
                <span className={styles.roleBadge}>{role.badge}</span>
              </div>

              <div className={`${styles.card} ${styles.cardRequests}`}>
                <div className={styles.cardLabel}>Demandes en cours</div>
                <div className={styles.bigNum}>12</div>
                <div className={styles.trend}>▲ +3 cette semaine</div>
                <svg className={styles.spark} viewBox="0 0 200 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 L25,32 L50,36 L75,22 L100,28 L125,18 L150,24 L175,12 L200,16 L200,50 L0,50 Z" fill="url(#sg1)" />
                  <path d="M0,40 L25,32 L50,36 L75,22 L100,28 L125,18 L150,24 L175,12 L200,16" stroke="#818cf8" strokeWidth="2" fill="none" />
                </svg>
              </div>

              {role.showRevenue ? (
                <div className={`${styles.card} ${styles.cardRevenue}`}>
                  <div className={styles.cardLabel}>Chiffre d&apos;affaires ce mois</div>
                  <div className={styles.bigNum}>€12 480</div>
                  <div className={styles.trend}>▲ +18% vs mois dernier</div>
                  <svg className={styles.spark} viewBox="0 0 200 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sg2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,35 L25,30 L50,38 L75,28 L100,22 L125,26 L150,14 L175,18 L200,8 L200,50 L0,50 Z" fill="url(#sg2)" />
                    <path d="M0,35 L25,30 L50,38 L75,28 L100,22 L125,26 L150,14 L175,18 L200,8" stroke="#10b981" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              ) : null}

              <div className={`${styles.card} ${styles.cardAccess}`}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>Accès rapide</h3>
                  <span className={styles.accessVisible}>
                    {visibleModulesCount} module{visibleModulesCount > 1 ? "s" : ""} · adaptés à votre poste
                  </span>
                </div>
                <div className={styles.quickGrid}>
                  {QUICK_TILES.map((tile) => {
                    const unlocked = role.modules.includes(tile.key);
                    const className = `${styles.quickTile} ${unlocked ? "" : styles.quickTileLocked}`;
                    if (unlocked && tile.href !== "#") {
                      return (
                        <Link key={tile.key} href={tile.href} className={className}>
                          <span className={styles.quickIco}>{tile.ico}</span>
                          <span className={styles.quickLbl}>{tile.label}</span>
                        </Link>
                      );
                    }
                    return (
                      <div key={tile.key} className={className}>
                        <span className={styles.quickIco}>{tile.ico}</span>
                        <span className={styles.quickLbl}>{tile.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${styles.card} ${styles.cardEvents}`}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{role.eventsTitle}</h3>
                  <a href="#" className={styles.linkMore}>Planning complet →</a>
                </div>
                <div className={styles.evList}>
                  <div className={styles.evRow}>
                    <div className={styles.evDate}>
                      <div className={styles.evDateDay}>30</div>
                      <div className={styles.evDateMonth}>Mai</div>
                    </div>
                    <div className={styles.evInfo}>
                      <div className={styles.evInfoName}>Wine tasting</div>
                      <div className={styles.evInfoSub}>La Cave · 19:00 · 3 membres</div>
                    </div>
                    <div className={styles.evGuests}>24 invités</div>
                  </div>
                  <div className={styles.evRow}>
                    <div className={styles.evDate}>
                      <div className={styles.evDateDay}>02</div>
                      <div className={styles.evDateMonth}>Juin</div>
                    </div>
                    <div className={styles.evInfo}>
                      <div className={styles.evInfoName}>Cooking workshop</div>
                      <div className={styles.evInfoSub}>Atelier · 18:30 · 2 membres</div>
                    </div>
                    <div className={styles.evGuests}>18 invités</div>
                  </div>
                  <div className={styles.evRow}>
                    <div className={styles.evDate}>
                      <div className={styles.evDateDay}>07</div>
                      <div className={styles.evDateMonth}>Juin</div>
                    </div>
                    <div className={styles.evInfo}>
                      <div className={styles.evInfoName}>Speed dating</div>
                      <div className={styles.evInfoSub}>Le Loft · 20:00 · 4 membres</div>
                    </div>
                    <div className={styles.evGuests}>32 invités</div>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.cardActivity}`}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{role.activityTitle}</h3>
                  <a href="#" className={styles.linkMore}>Tout voir →</a>
                </div>
                <div className={styles.actList}>
                  <div className={styles.actRow}>
                    <span className={styles.actDot} />
                    <span><strong>Julien</strong> s&apos;est positionné sur Wine tasting (30/05)</span>
                    <span className={styles.actTime}>il y a 12m</span>
                  </div>
                  <div className={styles.actRow}>
                    <span className={`${styles.actDot} ${styles.actDotGreen}`} />
                    <span>Facture payée — <strong>ACME · €1 240</strong></span>
                    <span className={styles.actTime}>il y a 1h</span>
                  </div>
                  <div className={styles.actRow}>
                    <span className={`${styles.actDot} ${styles.actDotAmber}`} />
                    <span><strong>Marie</strong> a soumis sa disponibilité juin</span>
                    <span className={styles.actTime}>il y a 3h</span>
                  </div>
                  <div className={styles.actRow}>
                    <span className={`${styles.actDot} ${styles.actDotRose}`} />
                    <span>Salaires Mai validés par le comptable</span>
                    <span className={styles.actTime}>hier</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.cardPriority}`}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{role.priorityTitle}</h3>
                  <a href="#" className={styles.linkMore}>Tout voir →</a>
                </div>
                <div className={styles.prList}>
                  <div className={styles.prRow}>
                    <span className={styles.prId}>#REQ-042</span>
                    <span className={styles.prText}>Valider le catering pour l&apos;événement du 30/05</span>
                    <span className={styles.pillPriority}>Urgent</span>
                    <span className={styles.prAge}>2 jours</span>
                  </div>
                  <div className={styles.prRow}>
                    <span className={styles.prId}>#REQ-039</span>
                    <span className={styles.prText}>Confirmer la venue pour Speed Dating du 07/06</span>
                    <span className={styles.pillPriority}>Urgent</span>
                    <span className={styles.prAge}>5 jours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Link href="/legacy" className={styles.holdVersion}>
          🕰 Version d&apos;origine
        </Link>
      </div>
    </div>
  );
}
