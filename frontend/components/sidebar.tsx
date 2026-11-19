"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isNavItemActive, navSections } from "@/lib/constants/navigation";
import { useHubData } from "@/lib/hub-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { authenticated, loading } = useHubData();
  // Below 1100px the menu collapses behind a toggle instead of stacking all
  // links above the page content.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <aside className={`sidebar${open ? " is-open" : ""}`}>
      <div className="brand-block">
        <div className="brand-row">
          <Link href="/dashboard" className="brand-link">
            <div className="brand-mark">◆</div>
            <div className="brand-copy">
              <h1>Crush Hub</h1>
              <p>Cockpit Opérationnel</p>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            aria-expanded={open}
            aria-controls="hub-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        <nav id="hub-nav" className="nav-list" aria-label="Navigation principale">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section-group">
              <div className="nav-section">{section.title}</div>
              {section.items.map((item) => {
                const active = isNavItemActive(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span style={{ fontSize: "1.05rem" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar-foot">
        <strong>🔒 Session sécurisée</strong>
        <p>
          {loading
            ? "Vérification de la session…"
            : authenticated
              ? "Connecté à Crush.lu. Chaque modification s'applique en production."
              : "Identifiez-vous via Crush.lu pour synchroniser vos données."}
        </p>
      </div>
    </aside>
  );
}
