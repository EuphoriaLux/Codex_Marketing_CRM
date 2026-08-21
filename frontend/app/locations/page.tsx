"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { fetchLocations } from "@/lib/api/locations";
import type { LocationItem, PartnershipStage } from "@/lib/types";

const stageOrder: Record<PartnershipStage, number> = {
  Active: 0,
  Negotiating: 1,
  Prospect: 2,
  Paused: 3,
  Archived: 4,
};

const stageClass: Record<PartnershipStage, string> = {
  Prospect: "prospect",
  Negotiating: "negotiating",
  Active: "active",
  Paused: "paused",
  Archived: "archived",
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLocations();
        if (mounted) {
          setLocations(data);
        }
      } catch (err) {
        if (mounted) {
          setError("Impossible de charger la liste des lieux partenaires.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...locations].sort(
        (a, b) =>
          (stageOrder[a.partnershipStage] ?? 99) -
          (stageOrder[b.partnershipStage] ?? 99),
      ),
    [locations],
  );

  const metrics = useMemo(() => {
    const total = locations.length;
    const active = locations.filter((l) => l.partnershipStage === "Active").length;
    const prospects = locations.filter(
      (l) =>
        l.partnershipStage === "Prospect" || l.partnershipStage === "Negotiating",
    ).length;
    return [
      { label: "Lieux partenaires", value: String(total).padStart(2, "0") },
      { label: "Partenaires actifs", value: String(active).padStart(2, "0") },
      { label: "En négociation / Pipeline", value: String(prospects).padStart(2, "0") },
    ];
  }, [locations]);

  const selected = useMemo(
    () => sorted.find((l) => l.id === selectedId) ?? null,
    [sorted, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="📍 Opérations & Lieux"
        title="Lieux Partenaires"
        description="Salles, bars et restaurants partenaires accueillant les événements Crush à Luxembourg — capacités, contacts et statut pipeline."
      />

      <HeroStats metrics={metrics} />

      {error ? (
        <div className="panel" style={{ color: "var(--danger)", padding: "1rem" }}>
          ⚠️ {error}
        </div>
      ) : null}

      <Panel
        title="Liste des établissements"
        description="Cliquez sur un lieu pour afficher sa fiche complète (contacts, équipements, conditions commerciales)."
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Chargement des lieux partenaires depuis l'API...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Aucun lieu partenaire trouvé ou session non authentifiée.
          </div>
        ) : (
          <div className="location-list">
            {sorted.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className={`location-row${selectedId === loc.id ? " active" : ""}`}
                onClick={() =>
                  setSelectedId((current) => (current === loc.id ? null : loc.id))
                }
              >
                <div className="location-row-name">
                  <strong>{loc.name}</strong>
                  <span>{loc.city}</span>
                </div>
                <span className={`stage-pill ${stageClass[loc.partnershipStage] || "prospect"}`}>
                  {loc.partnershipStage}
                </span>
                <span className="location-row-meta">
                  Capacité : {loc.maxCapacity} pers.
                  {loc.seatedCapacity ? ` (${loc.seatedCapacity} assis)` : ""}
                </span>
                <span className="location-row-meta">
                  {loc.compatibleEventTypes?.length || 0} type(s) d'events
                </span>
                <span className="location-row-meta">
                  {loc.lastContactDate ? `Contact : ${loc.lastContactDate}` : "Sans contact"}
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {selected ? (
        <LocationDrawer
          location={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </main>
  );
}

function LocationDrawer({
  location,
  onClose,
}: {
  location: LocationItem;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="location-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${location.name} details`}
      >
        <div className="drawer-head">
          <div>
            <h2>{location.name}</h2>
            <p className="drawer-subtitle">
              <span className={`stage-pill ${stageClass[location.partnershipStage] || "prospect"}`}>
                {location.partnershipStage}
              </span>
              {" · "}
              {location.city}, {location.country}
            </p>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <section className="drawer-section">
            <h3>Adresse</h3>
            <p>{location.address}</p>
          </section>

          <section className="drawer-section">
            <h3>Capacités & Équipements</h3>
            <dl className="location-meta-grid">
              <dt>Capacité Maximale</dt>
              <dd>{location.maxCapacity} personnes</dd>
              {location.seatedCapacity !== undefined ? (
                <>
                  <dt>Places assises</dt>
                  <dd>{location.seatedCapacity} personnes</dd>
                </>
              ) : null}
            </dl>
            <div className="feature-chip-row">
              <FeatureChip label="Espace extérieur / Terrasse" on={location.hasOutdoorSpace} />
              <FeatureChip label="Cuisine disponible" on={location.hasKitchen} />
              <FeatureChip label="Espace privatisable" on={location.hasPrivateRoom} />
              <FeatureChip label="Système son / Micro" on={location.hasSoundSystem} />
            </div>
          </section>

          <section className="drawer-section">
            <h3>Types d'événements adaptés</h3>
            <div className="event-type-row">
              {(location.compatibleEventTypes || []).map((type) => (
                <span key={type} className="event-type-chip">
                  {type}
                </span>
              ))}
            </div>
          </section>

          {location.primaryContact && (
            <section className="drawer-section">
              <h3>Contact Principal</h3>
              <div className="contact-line">
                <strong>
                  {location.primaryContact.name || "Non renseigné"}
                  {location.primaryContact.role && (
                    <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                      {" — "}
                      {location.primaryContact.role}
                    </span>
                  )}
                </strong>
                {location.primaryContact.email && (
                  <a href={`mailto:${location.primaryContact.email}`}>
                    {location.primaryContact.email}
                  </a>
                )}
                {location.primaryContact.phone && (
                  <a href={`tel:${location.primaryContact.phone.replace(/\s+/g, "")}`}>
                    {location.primaryContact.phone}
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="drawer-section">
            <h3>Partenariat & Gestion</h3>
            <dl className="location-meta-grid">
              <dt>Responsable de compte</dt>
              <dd>{location.accountManager || "Non assigné"}</dd>
              {location.partnerSince ? (
                <>
                  <dt>Partenaire depuis</dt>
                  <dd>{location.partnerSince}</dd>
                </>
              ) : null}
            </dl>
            {location.commercialTerms ? (
              <p style={{ marginTop: "0.5rem" }}>
                <strong>Conditions :</strong> {location.commercialTerms}
              </p>
            ) : null}
          </section>

          <section className="drawer-section">
            <h3>Historique & Suivi</h3>
            <dl className="location-meta-grid">
              <dt>Dernier contact</dt>
              <dd>{location.lastContactDate || "—"}</dd>
              {location.nextAction ? (
                <>
                  <dt>Prochaine action</dt>
                  <dd>
                    {location.nextAction}
                    {location.nextActionDate ? ` — ${location.nextActionDate}` : ""}
                  </dd>
                </>
              ) : null}
            </dl>
            {location.notes ? <p style={{ marginTop: "0.5rem" }}>{location.notes}</p> : null}
          </section>

          {location.tags && location.tags.length > 0 ? (
            <section className="drawer-section">
              <h3>Tags</h3>
              <div className="tag-row">
                {location.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function FeatureChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`feature-chip${on ? " on" : ""}`}>
      {on ? "✓" : "✗"} {label}
    </span>
  );
}
