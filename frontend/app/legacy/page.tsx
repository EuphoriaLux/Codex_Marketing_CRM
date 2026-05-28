"use client";

import Link from "next/link";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";

export default function LegacyHomePage() {
  const { customer, metrics, requests, resources } = useHubData();

  return (
    <main className="page">
      <StatusBanner />
      <section className="hero-block">
        <div>
          <p className="eyebrow">SPA Frontend</p>
          <h1>Crush Hub for clients, partners, and project contacts.</h1>
          <p className="hero-copy">
            A dedicated customer interface running as a client-side Next.js app.
            The UI already loads through one shared data layer, so your backend
            can plug in later without changing the product structure.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button">
              Open dashboard
            </Link>
            <Link href="/requests" className="button secondary">
              View requests
            </Link>
          </div>
        </div>
        <HeroStats metrics={metrics} />
      </section>

      <section className="two-up">
        <Panel
          title="Designed for the real stack"
          description="The frontend is independent, but the data contracts already reflect the backend you plan to plug in."
        >
          <ul className="stack-list">
            <li>Next.js App Router with client-side navigation</li>
            <li>Shared portal state provider across every route</li>
            <li>API-first loading with mock fallback for local UX work</li>
            <li>Customer-focused IA instead of a copied admin site</li>
          </ul>
        </Panel>

        <Panel
          title="Account snapshot"
          description="The first-release portal should make the customer situation legible in a few seconds."
        >
          <dl className="snapshot-grid">
            <div>
              <dt>Organization</dt>
              <dd>{customer.organization || "Not connected yet"}</dd>
            </div>
            <div>
              <dt>Primary contact</dt>
              <dd>{customer.primaryContact || "Not connected yet"}</dd>
            </div>
            <div>
              <dt>Open requests</dt>
              <dd>{requests.filter((item) => item.status !== "Closed").length}</dd>
            </div>
            <div>
              <dt>Shared resources</dt>
              <dd>{resources.length}</dd>
            </div>
          </dl>
        </Panel>
      </section>

      <Link
        href="/"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.7rem 1.2rem",
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          color: "white",
          fontWeight: 700,
          fontSize: "0.88rem",
          borderRadius: 999,
          boxShadow: "0 12px 30px rgba(99, 102, 241, 0.4)",
          zIndex: 100,
          textDecoration: "none",
        }}
      >
        ✨ Nouvelle version
      </Link>
    </main>
  );
}
