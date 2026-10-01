"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLocation, updateLocation } from "@/lib/api/locations";
import { STAGE_CLASSES, STAGE_OPTIONS } from "@/lib/constants/partners";
import type { LocationItem, PartnershipStage } from "@/lib/types";

type Props = {
  partner: LocationItem;
  offersCount: number;
  onboardingDone: number;
  onboardingTotal: number;
  onPartnerUpdated: (updated: LocationItem) => void;
};

export function PartnerHeader({
  partner,
  offersCount,
  onboardingDone,
  onboardingTotal,
  onPartnerUpdated,
}: Props) {
  const router = useRouter();
  const [updatingStage, setUpdatingStage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isActive = partner.partnershipStage === "Active";
  const hasIncompleteSteps = onboardingDone < onboardingTotal;

  async function handleStageChange(newStage: PartnershipStage) {
    try {
      setUpdatingStage(true);
      setActionError(null);
      const updated = await updateLocation(partner.id, { partnershipStage: newStage });
      onPartnerUpdated(updated);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erreur de mise à jour du statut.");
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${partner.name}" ?\n\nSi le partenaire a un historique financier, archivez-le plutôt.`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      setActionError(null);
      await deleteLocation(partner.id);
      router.push("/locations");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de supprimer ce partenaire.";
      setActionError(msg);
      setDeleting(false);
    }
  }

  return (
    <div className="partner-detail-header">
      <div className="partner-breadcrumb">
        <Link href="/locations" className="back-link">
          ← Retour à la liste des partenaires
        </Link>
      </div>

      {actionError && (
        <div className="status-banner" style={{ margin: "0.8rem 0", color: "var(--danger)" }}>
          ⚠️ {actionError}
        </div>
      )}

      {isActive && hasIncompleteSteps && (
        <div className="status-banner warning" style={{ margin: "0.8rem 0" }}>
          ⚠️ <strong>Attention :</strong> Ce partenaire est actuellement au statut <strong>Actif</strong>,
          mais sa checklist d'onboarding comporte encore des étapes ouvertes ({onboardingDone}/{onboardingTotal} terminées).
        </div>
      )}

      <div className="partner-header-main">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
            <h1 className="partner-title">{partner.name}</h1>
            <span className={`stage-pill ${STAGE_CLASSES[partner.partnershipStage] || "prospect"}`}>
              {partner.partnershipStage}
            </span>
          </div>
          <p className="partner-location-subtitle">
            📍 {partner.addressTown || partner.city || "Luxembourg"}
            {partner.canton ? ` (${partner.canton})` : ""} · Capacité {partner.maxCapacity} pers.
            {partner.seatedCapacity ? ` (${partner.seatedCapacity} assis)` : ""}
          </p>
        </div>

        <div className="partner-header-actions">
          <div className="stage-selector-wrap">
            <span className="stage-selector-label">Statut :</span>
            <select
              value={partner.partnershipStage}
              disabled={updatingStage}
              onChange={(e) => handleStageChange(e.target.value as PartnershipStage)}
              className="form-select stage-select"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="button secondary danger"
            disabled={deleting}
            onClick={handleDelete}
            title="Supprimer le partenaire"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>

      <div className="partner-kpi-bar">
        <div className="partner-kpi-item">
          <span className="kpi-label">Offres configurées</span>
          <span className="kpi-value">{offersCount}</span>
        </div>
        <div className="partner-kpi-item">
          <span className="kpi-label">Checklist onboarding</span>
          <span className="kpi-value">
            {onboardingDone} / {onboardingTotal}
          </span>
        </div>
        <div className="partner-kpi-item">
          <span className="kpi-label">Responsable</span>
          <span className="kpi-value">{partner.accountManager || "Non assigné"}</span>
        </div>
        <div className="partner-kpi-item">
          <span className="kpi-label">Dernier contact</span>
          <span className="kpi-value">{partner.lastContactDate || "—"}</span>
        </div>
      </div>
    </div>
  );
}
