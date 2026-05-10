"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";
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
  const { locations } = useHubData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...locations].sort(
        (a, b) => stageOrder[a.partnershipStage] - stageOrder[b.partnershipStage],
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
      { label: "Partner venues", value: String(total).padStart(2, "0") },
      { label: "Active partners", value: String(active).padStart(2, "0") },
      { label: "Pipeline", value: String(prospects).padStart(2, "0") },
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
        eyebrow="Hub"
        title="Locations"
        description="Partner venues hosting Crush events across Luxembourg — capacity, fit, and pipeline status in one place."
      />

      <HeroStats metrics={metrics} />

      <Panel
        title="Partner venues"
        description="Click a venue to open its full record. Records are read-only in this iteration."
      >
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
              <span className={`stage-pill ${stageClass[loc.partnershipStage]}`}>
                {loc.partnershipStage}
              </span>
              <span className="location-row-meta">up to {loc.maxCapacity}</span>
              <span className="location-row-meta">
                {loc.compatibleEventTypes.length} event type
                {loc.compatibleEventTypes.length === 1 ? "" : "s"}
              </span>
              <span className="location-row-meta">{loc.lastContactDate}</span>
            </button>
          ))}
        </div>
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
              <span className={`stage-pill ${stageClass[location.partnershipStage]}`}>
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
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <section className="drawer-section">
            <h3>Address</h3>
            <p>{location.address}</p>
          </section>

          <section className="drawer-section">
            <h3>Capacity</h3>
            <dl className="location-meta-grid">
              <dt>Max capacity</dt>
              <dd>{location.maxCapacity} guests</dd>
              {location.seatedCapacity !== undefined ? (
                <>
                  <dt>Seated</dt>
                  <dd>{location.seatedCapacity} guests</dd>
                </>
              ) : null}
            </dl>
            <div className="feature-chip-row">
              <FeatureChip label="Outdoor space" on={location.hasOutdoorSpace} />
              <FeatureChip label="Kitchen" on={location.hasKitchen} />
              <FeatureChip label="Private room" on={location.hasPrivateRoom} />
              <FeatureChip label="Sound system" on={location.hasSoundSystem} />
            </div>
          </section>

          <section className="drawer-section">
            <h3>Compatible event types</h3>
            <div className="event-type-row">
              {location.compatibleEventTypes.map((type) => (
                <span key={type} className="event-type-chip">
                  {type}
                </span>
              ))}
            </div>
          </section>

          <section className="drawer-section">
            <h3>Primary contact</h3>
            <div className="contact-line">
              <strong>
                {location.primaryContact.name}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                  {" — "}
                  {location.primaryContact.role}
                </span>
              </strong>
              <a href={`mailto:${location.primaryContact.email}`}>
                {location.primaryContact.email}
              </a>
              <a href={`tel:${location.primaryContact.phone.replace(/\s+/g, "")}`}>
                {location.primaryContact.phone}
              </a>
            </div>
          </section>

          <section className="drawer-section">
            <h3>Partnership</h3>
            <dl className="location-meta-grid">
              <dt>Account manager</dt>
              <dd>{location.accountManager}</dd>
              {location.partnerSince ? (
                <>
                  <dt>Partner since</dt>
                  <dd>{location.partnerSince}</dd>
                </>
              ) : null}
            </dl>
            {location.commercialTerms ? (
              <p>{location.commercialTerms}</p>
            ) : null}
          </section>

          <section className="drawer-section">
            <h3>Activity</h3>
            <dl className="location-meta-grid">
              <dt>Last contact</dt>
              <dd>{location.lastContactDate}</dd>
              {location.nextAction ? (
                <>
                  <dt>Next action</dt>
                  <dd>
                    {location.nextAction}
                    {location.nextActionDate ? ` — ${location.nextActionDate}` : ""}
                  </dd>
                </>
              ) : null}
            </dl>
            {location.notes ? <p>{location.notes}</p> : null}
          </section>

          {location.tags.length > 0 ? (
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
