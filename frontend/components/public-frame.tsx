"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link href="/" className="public-brand">
          <span className="brand-mark">C</span>
          <span className="public-brand-copy">
            <strong>Crush.lu</strong>
            <span>Événements et campagnes</span>
          </span>
        </Link>
        <nav className="public-nav" aria-label="Public">
          <Link href="/partnership" className="public-nav-link">
            Partenariats
          </Link>
          <Link href="/login" className="button secondary">
            Espace client
          </Link>
        </nav>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div>
          <strong>Crush.lu</strong>
          <p>Luxembourg — événements et activations sur mesure.</p>
        </div>
        <div className="public-footer-links">
          <Link href="/partnership">Devenir partenaire</Link>
          <Link href="/login">Espace client</Link>
        </div>
      </footer>
    </div>
  );
}
