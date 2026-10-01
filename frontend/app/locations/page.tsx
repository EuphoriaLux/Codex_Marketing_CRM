"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { fetchLocations } from "@/lib/api/locations";
import {
  STAGE_CLASSES,
  STAGE_OPTIONS,
} from "@/lib/constants/partners";
import type { LocationItem, PartnershipStage } from "@/lib/types";
import { AddPartnerModal } from "./_components/add-partner-modal";

const stageOrder: Record<PartnershipStage, number> = {
  Active: 0,
  Negotiating: 1,
  Prospect: 2,
  Paused: 3,
  Archived: 4,
};

type SortOption = "next_action" | "name" | "stage" | "capacity";

export default function PartnersPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("next_action");

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      } catch {
        if (mounted) {
          setError("Impossible de charger la liste des partenaires depuis l'API.");
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

  // Filtered list
  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      // Stage filter
      if (selectedStage !== "all" && loc.partnershipStage !== selectedStage) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const tagsStr = (loc.tags || []).join(" ").toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(query);
        const matchesCity = (loc.addressTown || loc.city || "").toLowerCase().includes(query);
        const matchesAddress = (loc.address || "").toLowerCase().includes(query);
        const matchesManager = (loc.accountManager || "").toLowerCase().includes(query);
        const matchesTags = tagsStr.includes(query);
        const matchesNotes = (loc.notes || "").toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesAddress && !matchesManager && !matchesTags && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [locations, selectedStage, search]);

  // Sorted list
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "next_action") {
      list.sort((a, b) => {
        // Items with nextActionDate come first, sorted by earliest date
        if (a.nextActionDate && b.nextActionDate) {
          return a.nextActionDate.localeCompare(b.nextActionDate);
        }
        if (a.nextActionDate && !b.nextActionDate) return -1;
        if (!a.nextActionDate && b.nextActionDate) return 1;
        // fallback to stage
        return (stageOrder[a.partnershipStage] ?? 99) - (stageOrder[b.partnershipStage] ?? 99);
      });
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stage") {
      list.sort(
        (a, b) =>
          (stageOrder[a.partnershipStage] ?? 99) -
          (stageOrder[b.partnershipStage] ?? 99),
      );
    } else if (sortBy === "capacity") {
      list.sort((a, b) => b.maxCapacity - a.maxCapacity);
    }
    return list;
  }, [filtered, sortBy]);

  // Keep existing stage counts + offer counts
  const metrics = useMemo(() => {
    const total = locations.length;
    const active = locations.filter((l) => l.partnershipStage === "Active").length;
    const prospects = locations.filter(
      (l) =>
        l.partnershipStage === "Prospect" || l.partnershipStage === "Negotiating",
    ).length;
    const totalOffers = locations.reduce((sum, l) => sum + (l.offerCount || 0), 0);

    return [
      { label: "Partenaires enregistrés", value: String(total).padStart(2, "0") },
      { label: "Partenaires actifs", value: String(active).padStart(2, "0") },
      { label: "En négociation / Pipeline", value: String(prospects).padStart(2, "0") },
      { label: "Offres configurées", value: String(totalOffers).padStart(2, "0") },
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
        eyebrow="🤝 Opérations & CRM"
        title="Partenaires"
        description="Bars, restaurants et tiers-lieux partenaires accueillant les événements Crush à Luxembourg — suivi du pipeline, capacités, offres et contacts."
      />

      <HeroStats metrics={metrics} />

      {error && (
        <div className="panel" style={{ color: "var(--danger)", padding: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* TOOLBAR CONTROLS */}
      <section className="panel partner-controls-toolbar">
        <div className="partner-controls-top">
          <div className="partner-search-box">
            <input
              type="search"
              placeholder="Rechercher par nom, ville, tag, responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="partner-sort-box">
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
              Trier par :
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="form-select"
            >
              <option value="next_action">Prochaine action date</option>
              <option value="name">Nom (A–Z)</option>
              <option value="stage">Statut pipeline</option>
              <option value="capacity">Capacité max</option>
            </select>
          </div>

          <button
            type="button"
            className="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            + Nouveau partenaire
          </button>
        </div>

        {/* STAGE FILTER PILLS */}
        <div className="stage-filter-pills">
          <button
            type="button"
            className={`filter-pill${selectedStage === "all" ? " active" : ""}`}
            onClick={() => setSelectedStage("all")}
          >
            Tous ({locations.length})
          </button>
          {STAGE_OPTIONS.map((opt) => {
            const count = locations.filter((l) => l.partnershipStage === opt.value).length;
            return (
              <button
                key={opt.value}
                type="button"
                className={`filter-pill ${opt.class}${selectedStage === opt.value ? " active" : ""}`}
                onClick={() => setSelectedStage(opt.value)}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      <Panel
        title={`Liste des établissements (${sorted.length})`}
        description="Cliquez sur un partenaire pour un aperçu rapide, ou ouvrez sa fiche complète pour gérer ses offres et sa checklist."
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Chargement des partenaires depuis l'API...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            {locations.length === 0
              ? "Aucun partenaire trouvé ou session non authentifiée."
              : "Aucun partenaire ne correspond aux critères de recherche."}
          </div>
        ) : (
          <div className="partner-table-list">
            {sorted.map((loc) => {
              const onboardingDone = loc.onboardingProgress?.done || 0;
              const onboardingTotal = loc.onboardingProgress?.total || 8;
              const hasUpcomingAction = Boolean(loc.nextActionDate);

              return (
                <div
                  key={loc.id}
                  className={`partner-list-card${selectedId === loc.id ? " selected" : ""}`}
                >
                  <div className="partner-card-info" onClick={() => setSelectedId(loc.id)}>
                    <div className="partner-card-title-row">
                      <strong className="partner-card-name">{loc.name}</strong>
                      <span className={`stage-pill ${STAGE_CLASSES[loc.partnershipStage] || "prospect"}`}>
                        {loc.partnershipStage}
                      </span>
                    </div>

                    <div className="partner-card-details">
                      <span>📍 {loc.addressTown || loc.city}</span>
                      {loc.canton && <span>· {loc.canton}</span>}
                      <span>· Capacité : {loc.maxCapacity} pers.</span>
                      {loc.seatedCapacity ? <span>({loc.seatedCapacity} assis)</span> : null}
                    </div>

                    <div className="partner-card-submeta">
                      {loc.nextAction ? (
                        <span className={`next-action-tag${hasUpcomingAction ? " alert" : ""}`}>
                          ⚡ {loc.nextAction}
                          {loc.nextActionDate ? ` (${loc.nextActionDate})` : ""}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                          Dernier contact : {loc.lastContactDate || "Non renseigné"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="partner-card-badges">
                    <span className="card-counter-pill" title="Offres configurées pour ce lieu">
                      🎟️ {loc.offerCount || 0} offre{(loc.offerCount || 0) > 1 ? "s" : ""}
                    </span>

                    <span
                      className={`card-counter-pill ${onboardingDone === onboardingTotal ? "done" : ""}`}
                      title="Progression checklist onboarding"
                    >
                      ✅ {onboardingDone}/{onboardingTotal}
                    </span>
                  </div>

                  <div className="partner-card-actions">
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: "0.45rem 0.8rem", fontSize: "0.82rem" }}
                      onClick={() => setSelectedId(loc.id)}
                    >
                      Aperçu
                    </button>
                    <Link
                      href={`/locations/detail?id=${loc.id}`}
                      className="button"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                    >
                      Fiche complète →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* QUICK DRAWER */}
      {selected ? (
        <LocationDrawer
          location={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {/* ADD PARTNER MODAL */}
      <AddPartnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(created) => {
          setLocations((prev) => [created, ...prev]);
        }}
      />
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
              <span className={`stage-pill ${STAGE_CLASSES[location.partnershipStage] || "prospect"}`}>
                {location.partnershipStage}
              </span>
              {" · "}
              {location.addressTown || location.city}, {location.country}
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
          <div style={{ marginBottom: "1.2rem" }}>
            <Link
              href={`/locations/detail?id=${location.id}`}
              className="button"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Ouvrir la fiche complète & gérer les offres →
            </Link>
          </div>

          <section className="drawer-section">
            <h3>Adresse & Localisation</h3>
            <p>{location.address}</p>
            {location.canton && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                Canton : {location.canton}
              </p>
            )}
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
              <FeatureChip label="Terrasse / Extérieur" on={location.hasOutdoorSpace} />
              <FeatureChip label="Cuisine disponible" on={location.hasKitchen} />
              <FeatureChip label="Espace privatisable" on={location.hasPrivateRoom} />
              <FeatureChip label="Système son / Micro" on={location.hasSoundSystem} />
            </div>
          </section>

          <section className="drawer-section">
            <h3>Offres & Onboarding</h3>
            <dl className="location-meta-grid">
              <dt>Offres configurées</dt>
              <dd>{location.offerCount || 0} offre(s)</dd>
              <dt>Checklist onboarding</dt>
              <dd>
                {location.onboardingProgress
                  ? `${location.onboardingProgress.done} / ${location.onboardingProgress.total} étapes`
                  : "Non initiée"}
              </dd>
            </dl>
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
