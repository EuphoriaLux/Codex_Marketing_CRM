"use client";

import { useState } from "react";
import { buildCoachEventUrl } from "@/lib/api/locations";
import { EVENT_TYPE_MAP, WEEKDAYS_MAP } from "@/lib/constants/partners";
import type { OfferEventDraft, OfferEventType } from "@/lib/types";

type Props = {
  draft: OfferEventDraft | null;
  offerName: string;
  onClose: () => void;
};

export function EventDraftModal({ draft, offerName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!draft) return null;

  const coachUrl = buildCoachEventUrl(draft);
  const fields = draft.fields;
  const eventTypeInfo = EVENT_TYPE_MAP[fields.event_type as OfferEventType] || {
    label: fields.event_type,
    icon: "🎟️",
  };

  const weekdaysText = (draft.suggestedWeekdays || [])
    .map((d) => WEEKDAYS_MAP.find((w) => w.day === d)?.short || `J${d}`)
    .join(", ");

  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="partner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-modal-title"
        style={{ maxWidth: "680px" }}
      >
        <div className="partner-modal-head">
          <div>
            <h2 id="draft-modal-title">Créer un événement depuis l'offre</h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
              Préremplissage généré pour : <strong>{offerName}</strong>
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

        <div className="partner-modal-form">
          <div className="status-banner success" style={{ marginBottom: "1rem" }}>
            ✓ Les caractéristiques de l'offre et du partenaire sont prêtes pour le formulaire coach.
            Aucun événement n'a encore été publié en base.
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Paramètres préremplis de l'événement</h3>
            <div className="draft-preview-grid">
              <div className="draft-field">
                <span className="draft-field-label">Type d'événement</span>
                <span className="draft-field-val">
                  {eventTypeInfo.icon} {eventTypeInfo.label}
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Lieu & Ville</span>
                <span className="draft-field-val">
                  📍 {fields.location} ({fields.address_town || fields.canton})
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Capacité totale</span>
                <span className="draft-field-val">
                  👥 {fields.max_participants} participants
                  {(fields.max_participants_m || fields.max_participants_f) && (
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginLeft: "0.4rem" }}>
                      ({fields.max_participants_m ?? "—"} H / {fields.max_participants_f ?? "—"} F)
                    </span>
                  )}
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Tarif d'inscription</span>
                <span className="draft-field-val">
                  💶 {Number(fields.registration_fee || 0).toFixed(2)} €
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Durée</span>
                <span className="draft-field-val">
                  ⏱️ {fields.duration_minutes} minutes
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Créneau suggéré</span>
                <span className="draft-field-val">
                  🗓️ {weekdaysText || "Non défini"}{" "}
                  {draft.suggestedStartTime ? `à ${draft.suggestedStartTime}` : ""}
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Tranche d'âge</span>
                <span className="draft-field-val">
                  🎂 {fields.min_age} – {fields.max_age} ans
                </span>
              </div>

              <div className="draft-field">
                <span className="draft-field-label">Langues</span>
                <span className="draft-field-val">
                  🌐 {(fields.languages || []).map((l) => l.toUpperCase()).join(", ") || "EN, FR"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <div className="draft-field">
                <span className="draft-field-label">Titre (FR / EN)</span>
                <span className="draft-field-val">
                  {fields.title_fr || fields.title_en}
                </span>
              </div>
              <div className="draft-field">
                <span className="draft-field-label">Adresse complète</span>
                <span className="draft-field-val" style={{ color: "var(--muted)" }}>
                  {fields.address_street} {fields.address_number}, L-{fields.address_postcode} {fields.address_town} ({fields.canton})
                </span>
              </div>
            </div>
          </div>

          <div className="partner-modal-actions" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="button secondary"
              onClick={handleCopyJson}
            >
              {copied ? "✓ JSON Copié !" : "📋 Copier les données JSON"}
            </button>

            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button
                type="button"
                className="button secondary"
                onClick={onClose}
              >
                Fermer
              </button>
              <a
                href={coachUrl}
                target="_blank"
                rel="noreferrer"
                className="button"
                style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}
              >
                <span>Ouvrir dans Crush.lu</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
