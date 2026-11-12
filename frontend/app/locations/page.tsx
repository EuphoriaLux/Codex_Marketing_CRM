"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  claimLocation,
  fetchLocations,
  unclaimLocation,
} from "@/lib/api/locations";
import {
  LUXEMBOURG_CANTONS,
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

const PAGE_SIZE = 48;

type SortOption = "next_action" | "name" | "stage" | "capacity";
type ClaimFilter = "all" | "unclaimed" | "mine" | "claimed";

function getOwnerName(loc: LocationItem): string {
  return (loc.claimedByName || loc.accountManager || "").trim();
}

function isLocationClaimed(loc: LocationItem): boolean {
  return Boolean(loc.claimedById || getOwnerName(loc));
}

export default function PartnersPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters, Sorting & Pagination
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
  const [selectedCanton, setSelectedCanton] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("next_action");
  const [page, setPage] = useState(1);

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

  async function handleClaimToggle(loc: LocationItem) {
    try {
      setClaimingId(loc.id);
      setError(null);
      const updated = loc.claimedByMe
        ? await unclaimLocation(loc.id)
        : await claimLocation(loc.id);
      setLocations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Ce lieu vient d'être réclamé par un autre coach.",
      );
      try {
        const fresh = await fetchLocations();
        setLocations(fresh);
      } catch {
        // Keep current list if refresh fails
      }
    } finally {
      setClaimingId(null);
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedStage, claimFilter, selectedCanton, sortBy]);

  // Filtered list
  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      // Stage filter
      if (selectedStage !== "all" && loc.partnershipStage !== selectedStage) {
        return false;
      }
      // Claim filter
      const claimed = isLocationClaimed(loc);
      if (claimFilter === "unclaimed" && claimed) {
        return false;
      }
      if (claimFilter === "mine" && !loc.claimedByMe) {
        return false;
      }
      if (claimFilter === "claimed" && !claimed) {
        return false;
      }
      // Canton filter
      if (selectedCanton !== "all" && (loc.canton || "") !== selectedCanton) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const tagsStr = (loc.tags || []).join(" ").toLowerCase();
        const owner = getOwnerName(loc).toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(query);
        const matchesCity = (loc.addressTown || loc.city || "")
          .toLowerCase()
          .includes(query);
        const matchesAddress = (loc.address || "").toLowerCase().includes(query);
        const matchesManager = owner.includes(query);
        const matchesTags = tagsStr.includes(query);
        const matchesNotes = (loc.notes || "").toLowerCase().includes(query);
        if (
          !matchesName &&
          !matchesCity &&
          !matchesAddress &&
          !matchesManager &&
          !matchesTags &&
          !matchesNotes
        ) {
          return false;
        }
      }
      return true;
    });
  }, [locations, selectedStage, claimFilter, selectedCanton, search]);

  // Sorted list
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "next_action") {
      list.sort((a, b) => {
        if (a.nextActionDate && b.nextActionDate) {
          return a.nextActionDate.localeCompare(b.nextActionDate);
        }
        if (a.nextActionDate && !b.nextActionDate) return -1;
        if (!a.nextActionDate && b.nextActionDate) return 1;
        return (
          (stageOrder[a.partnershipStage] ?? 99) -
          (stageOrder[b.partnershipStage] ?? 99)
        );
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, currentPage]);

  // Counts for claim filters (scoped to current stage selection so numbers make sense)
  const stageScopedLocations = useMemo(() => {
    if (selectedStage === "all") return locations;
    return locations.filter((l) => l.partnershipStage === selectedStage);
  }, [locations, selectedStage]);

  const claimCounts = useMemo(() => {
    let unclaimed = 0;
    let mine = 0;
    let claimed = 0;
    for (const loc of stageScopedLocations) {
      if (isLocationClaimed(loc)) {
        claimed += 1;
        if (loc.claimedByMe) mine += 1;
      } else {
        unclaimed += 1;
      }
    }
    return {
      all: stageScopedLocations.length,
      unclaimed,
      mine,
      claimed,
    };
  }, [stageScopedLocations]);

  // Top KPI metrics
  const metrics = useMemo(() => {
    const total = locations.length;
    const unclaimedProspects = locations.filter(
      (l) => l.partnershipStage === "Prospect" && !isLocationClaimed(l),
    ).length;
    const claimedTotal = locations.filter((l) => isLocationClaimed(l)).length;
    const active = locations.filter((l) => l.partnershipStage === "Active").length;

    return [
      { label: "Lieux répertoriés", value: String(total).padStart(2, "0") },
      {
        label: "Prospects libres (Unclaimed)",
        value: String(unclaimedProspects).padStart(2, "0"),
      },
      {
        label: "Lieux réclamés par un coach",
        value: String(claimedTotal).padStart(2, "0"),
      },
      { label: "Partenaires actifs", value: String(active).padStart(2, "0") },
    ];
  }, [locations]);

  const selected = useMemo(
    () => locations.find((l) => l.id === selectedId) ?? null,
    [locations, selectedId],
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
        title="Partenaires & Prospection"
        description="Répertoire des bars, restaurants et lieux au Luxembourg (OpenStreetMap + echo.lu). Réclamez un prospect avant de le contacter pour éviter qu'un autre Crush Coach ne démarche le même établissement."
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
              placeholder="Rechercher par nom, ville, tag, coach responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="partner-sort-box">
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              Canton :
            </span>
            <select
              value={selectedCanton}
              onChange={(e) => setSelectedCanton(e.target.value)}
              className="form-select"
            >
              <option value="all">Tous les cantons</option>
              {LUXEMBOURG_CANTONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="partner-sort-box">
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
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
            Tous les statuts ({locations.length})
          </button>
          {STAGE_OPTIONS.map((opt) => {
            const count = locations.filter(
              (l) => l.partnershipStage === opt.value,
            ).length;
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

        {/* CLAIM / OWNERSHIP FILTER PILLS */}
        <div
          className="stage-filter-pills"
          style={{
            marginTop: "0.6rem",
            paddingTop: "0.6rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--muted)",
              alignSelf: "center",
              marginRight: "0.35rem",
            }}
          >
            Attribution :
          </span>
          <button
            type="button"
            className={`filter-pill${claimFilter === "all" ? " active" : ""}`}
            onClick={() => setClaimFilter("all")}
          >
            Tous ({claimCounts.all})
          </button>
          <button
            type="button"
            className={`filter-pill active-stage${claimFilter === "unclaimed" ? " active" : ""}`}
            onClick={() => setClaimFilter("unclaimed")}
          >
            🟢 Libres / Unclaimed ({claimCounts.unclaimed})
          </button>
          <button
            type="button"
            className={`filter-pill negotiating${claimFilter === "mine" ? " active" : ""}`}
            onClick={() => setClaimFilter("mine")}
          >
            🙋 Mes lieux ({claimCounts.mine})
          </button>
          <button
            type="button"
            className={`filter-pill paused${claimFilter === "claimed" ? " active" : ""}`}
            onClick={() => setClaimFilter("claimed")}
          >
            🔒 Réclamés / Claimed ({claimCounts.claimed})
          </button>
        </div>
      </section>

      <Panel
        title={`Liste des établissements (${sorted.length})`}
        description="Réclamez un prospect libre en 1 clic avant de prendre contact avec le gérant."
      >
        {loading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Chargement des partenaires depuis l'API...
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            {locations.length === 0
              ? "Aucun partenaire trouvé ou session non authentifiée."
              : "Aucun établissement ne correspond aux filtres sélectionnés."}
          </div>
        ) : (
          <>
            <div className="partner-table-list">
              {paginated.map((loc) => {
                const onboardingDone = loc.onboardingProgress?.done || 0;
                const onboardingTotal = loc.onboardingProgress?.total || 8;
                const hasUpcomingAction = Boolean(loc.nextActionDate);
                const ownerName = getOwnerName(loc);
                const claimed = isLocationClaimed(loc);
                const isMine = Boolean(loc.claimedByMe);
                const isBusy = claimingId === loc.id;

                return (
                  <div
                    key={loc.id}
                    className={`partner-list-card${selectedId === loc.id ? " selected" : ""}`}
                  >
                    <div
                      className="partner-card-info"
                      onClick={() => setSelectedId(loc.id)}
                    >
                      <div className="partner-card-title-row">
                        <strong className="partner-card-name">{loc.name}</strong>
                        <span
                          className={`stage-pill ${STAGE_CLASSES[loc.partnershipStage] || "prospect"}`}
                        >
                          {loc.partnershipStage}
                        </span>
                        {claimed ? (
                          <span
                            className="card-counter-pill"
                            style={{
                              background: isMine
                                ? "rgba(16, 185, 129, 0.16)"
                                : "rgba(245, 158, 11, 0.16)",
                              color: isMine ? "#34d399" : "#fbbf24",
                              border: isMine
                                ? "1px solid rgba(16, 185, 129, 0.35)"
                                : "1px solid rgba(245, 158, 11, 0.35)",
                            }}
                          >
                            {isMine
                              ? `🙋 Mon lieu (${ownerName})`
                              : `🔒 Réclamé par ${ownerName}`}
                          </span>
                        ) : (
                          <span
                            className="card-counter-pill"
                            style={{
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#6ee7b7",
                              border: "1px solid rgba(16, 185, 129, 0.25)",
                            }}
                          >
                            🟢 Libre
                          </span>
                        )}
                      </div>

                      <div className="partner-card-details">
                        <span>📍 {loc.addressTown || loc.city}</span>
                        {loc.canton && <span>· {loc.canton}</span>}
                        <span>· Capacité : {loc.maxCapacity} pers.</span>
                        {loc.seatedCapacity ? (
                          <span>({loc.seatedCapacity} assis)</span>
                        ) : null}
                      </div>

                      <div className="partner-card-submeta">
                        {loc.nextAction ? (
                          <span
                            className={`next-action-tag${hasUpcomingAction ? " alert" : ""}`}
                          >
                            ⚡ {loc.nextAction}
                            {loc.nextActionDate ? ` (${loc.nextActionDate})` : ""}
                          </span>
                        ) : (
                          <span
                            style={{ color: "var(--muted)", fontSize: "0.82rem" }}
                          >
                            Dernier contact :{" "}
                            {loc.lastContactDate || "Non renseigné"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="partner-card-badges">
                      <span
                        className="card-counter-pill"
                        title="Offres configurées pour ce lieu"
                      >
                        🎟️ {loc.offerCount || 0} offre
                        {(loc.offerCount || 0) > 1 ? "s" : ""}
                      </span>

                      <span
                        className={`card-counter-pill ${onboardingDone === onboardingTotal ? "done" : ""}`}
                        title="Progression checklist onboarding"
                      >
                        ✅ {onboardingDone}/{onboardingTotal}
                      </span>
                    </div>

                    <div className="partner-card-actions">
                      {!claimed ? (
                        <button
                          type="button"
                          className="button"
                          disabled={isBusy}
                          style={{
                            padding: "0.45rem 0.8rem",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleClaimToggle(loc);
                          }}
                        >
                          {isBusy ? "..." : "🙋 Réclamer"}
                        </button>
                      ) : isMine ? (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={isBusy}
                          style={{
                            padding: "0.45rem 0.8rem",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleClaimToggle(loc);
                          }}
                        >
                          {isBusy ? "..." : "Libérer"}
                        </button>
                      ) : null}

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
                        className="button secondary"
                        style={{
                          padding: "0.45rem 0.85rem",
                          fontSize: "0.82rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Fiche →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Page {currentPage} sur {totalPages} ({sorted.length} lieux)
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Précédent
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>

      {/* QUICK DRAWER */}
      {selected ? (
        <LocationDrawer
          location={selected}
          claiming={claimingId === selected.id}
          onClaimToggle={() => void handleClaimToggle(selected)}
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
  claiming,
  onClaimToggle,
  onClose,
}: {
  location: LocationItem;
  claiming: boolean;
  onClaimToggle: () => void;
  onClose: () => void;
}) {
  const ownerName = getOwnerName(location);
  const claimed = isLocationClaimed(location);
  const isMine = Boolean(location.claimedByMe);

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
              <span
                className={`stage-pill ${STAGE_CLASSES[location.partnershipStage] || "prospect"}`}
              >
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
          <div
            style={{
              marginBottom: "1.2rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {(!claimed || isMine) && (
              <button
                type="button"
                className={isMine ? "button secondary" : "button"}
                disabled={claiming}
                onClick={onClaimToggle}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {claiming
                  ? "Mise à jour..."
                  : isMine
                    ? "Libérer ce lieu (rendre disponible)"
                    : "🙋 Réclamer ce lieu pour prospection"}
              </button>
            )}
            <Link
              href={`/locations/detail?id=${location.id}`}
              className="button"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Ouvrir la fiche complète & gérer les offres →
            </Link>
            <Link
              href={`/locations/detail?id=${location.id}&tab=events`}
              className="button secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              🗓️ Voir les événements associés (passés & en ligne) →
            </Link>
          </div>

          <section className="drawer-section">
            <h3>Attribution & Prospection</h3>
            <dl className="location-meta-grid">
              <dt>Statut d'attribution</dt>
              <dd>
                {claimed
                  ? isMine
                    ? `🙋 Réclamé par vous (${ownerName})`
                    : `🔒 Réclamé par ${ownerName}`
                  : "🟢 Libre — disponible pour prospection"}
              </dd>
              {location.claimedAt && (
                <>
                  <dt>Réclamé le</dt>
                  <dd>{new Date(location.claimedAt).toLocaleDateString("fr-LU")}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="drawer-section">
            <h3>Adresse & Localisation</h3>
            <p>{location.address}</p>
            {location.canton && (
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                  marginTop: "0.2rem",
                }}
              >
                Canton : {location.canton}
              </p>
            )}
            {location.website && (
              <p style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
                <a
                  href={location.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🌐 {location.website}
                </a>
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
              <FeatureChip
                label="Terrasse / Extérieur"
                on={location.hasOutdoorSpace}
              />
              <FeatureChip label="Cuisine disponible" on={location.hasKitchen} />
              <FeatureChip
                label="Espace privatisable"
                on={location.hasPrivateRoom}
              />
              <FeatureChip
                label="Système son / Micro"
                on={location.hasSoundSystem}
              />
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
                  <a
                    href={`tel:${location.primaryContact.phone.replace(/\s+/g, "")}`}
                  >
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
              <dd>{ownerName || "Non assigné"}</dd>
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
                    {location.nextActionDate
                      ? ` — ${location.nextActionDate}`
                      : ""}
                  </dd>
                </>
              ) : null}
            </dl>
            {location.notes ? (
              <p style={{ marginTop: "0.5rem" }}>{location.notes}</p>
            ) : null}
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
