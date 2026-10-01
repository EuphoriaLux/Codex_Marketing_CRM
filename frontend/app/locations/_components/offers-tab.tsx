"use client";

import { useEffect, useRef, useState } from "react";
import {
  createOffer,
  deleteOffer,
  fetchOfferEventDraft,
  fetchOffers,
  updateOffer,
} from "@/lib/api/locations";
import {
  EVENT_TYPE_MAP,
  EVENT_TYPE_OPTIONS,
  WEEKDAYS_MAP,
} from "@/lib/constants/partners";
import type {
  LocationItem,
  OfferEventDraft,
  OfferEventType,
  PartnerOffer,
} from "@/lib/types";
import { EventDraftModal } from "./event-draft-modal";

type Props = {
  partner: LocationItem;
  onOffersCountUpdated?: (count: number) => void;
};

const DEFAULT_OFFER_FORM: Omit<PartnerOffer, "id" | "locationId" | "updatedAt"> = {
  name: "",
  eventType: "speed_dating",
  isActive: true,
  weekdays: [3], // Thursday by default
  startTime: "19:30",
  durationMinutes: 120,
  maxParticipants: 20,
  maxParticipantsM: null,
  maxParticipantsF: null,
  maxParticipantsNb: null,
  minAge: 18,
  maxAge: 99,
  registrationFee: 20,
  partnerCostNotes: "",
  title: { en: "", fr: "", de: "" },
  description: { en: "", fr: "", de: "" },
  hasFoodComponent: false,
  allowPlusOnes: false,
  spaceUsed: "",
  setupNotes: "",
  languages: ["en", "fr"],
};

export function OffersTab({ partner, onOffersCountUpdated }: Props) {
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onOffersCountUpdatedRef = useRef(onOffersCountUpdated);
  useEffect(() => {
    onOffersCountUpdatedRef.current = onOffersCountUpdated;
  }, [onOffersCountUpdated]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_OFFER_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active language for bilingual inputs
  const [activeLangTab, setActiveLangTab] = useState<"fr" | "en" | "de">("fr");

  // Event Draft Modal
  const [activeDraft, setActiveDraft] = useState<OfferEventDraft | null>(null);
  const [draftOfferName, setDraftOfferName] = useState("");
  const [draftLoadingId, setDraftLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOffers(partner.id);
        if (mounted) {
          setOffers(data);
          onOffersCountUpdatedRef.current?.(data.length);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement des offres.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [partner.id]);

  function handleOpenCreate() {
    setEditingOfferId(null);
    setFormData({
      ...DEFAULT_OFFER_FORM,
      name: `Soirée ${partner.name}`,
      title: {
        en: `Event at ${partner.name}`,
        fr: `Événement au ${partner.name}`,
        de: `Event im ${partner.name}`,
      },
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(offer: PartnerOffer) {
    setEditingOfferId(offer.id);
    setFormData({
      name: offer.name,
      eventType: offer.eventType,
      isActive: offer.isActive,
      weekdays: offer.weekdays || [],
      startTime: offer.startTime || "19:30",
      durationMinutes: offer.durationMinutes || 120,
      maxParticipants: offer.maxParticipants || 20,
      maxParticipantsM: offer.maxParticipantsM ?? null,
      maxParticipantsF: offer.maxParticipantsF ?? null,
      maxParticipantsNb: offer.maxParticipantsNb ?? null,
      minAge: offer.minAge ?? 18,
      maxAge: offer.maxAge ?? 99,
      registrationFee: Number(offer.registrationFee ?? 0),
      partnerCostNotes: offer.partnerCostNotes || "",
      title: {
        en: offer.title?.en || "",
        fr: offer.title?.fr || "",
        de: offer.title?.de || "",
      },
      description: {
        en: offer.description?.en || "",
        fr: offer.description?.fr || "",
        de: offer.description?.de || "",
      },
      hasFoodComponent: Boolean(offer.hasFoodComponent),
      allowPlusOnes: Boolean(offer.allowPlusOnes),
      spaceUsed: offer.spaceUsed || "",
      setupNotes: offer.setupNotes || "",
      languages: offer.languages || ["en", "fr"],
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleDuplicate(offer: PartnerOffer) {
    try {
      const copyData: Partial<PartnerOffer> = {
        name: `${offer.name} (copie)`,
        eventType: offer.eventType,
        isActive: true,
        weekdays: offer.weekdays,
        startTime: offer.startTime,
        durationMinutes: offer.durationMinutes,
        maxParticipants: offer.maxParticipants,
        maxParticipantsM: offer.maxParticipantsM,
        maxParticipantsF: offer.maxParticipantsF,
        maxParticipantsNb: offer.maxParticipantsNb,
        minAge: offer.minAge,
        maxAge: offer.maxAge,
        registrationFee: Number(offer.registrationFee),
        partnerCostNotes: offer.partnerCostNotes,
        title: { ...offer.title },
        description: { ...offer.description },
        hasFoodComponent: offer.hasFoodComponent,
        allowPlusOnes: offer.allowPlusOnes,
        spaceUsed: offer.spaceUsed,
        setupNotes: offer.setupNotes,
        languages: [...offer.languages],
      };

      const created = await createOffer(partner.id, copyData);
      setOffers((prev) => [...prev, created]);
      onOffersCountUpdated?.(offers.length + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de dupliquer l'offre.");
    }
  }

  async function handleToggleActive(offer: PartnerOffer) {
    try {
      const nextActive = !offer.isActive;
      const updated = await updateOffer(partner.id, offer.id, { isActive: nextActive });
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de modifier le statut de l'offre.");
    }
  }

  async function handleDelete(offer: PartnerOffer) {
    if (!window.confirm(`Supprimer définitivement l'offre "${offer.name}" ?`)) return;
    try {
      await deleteOffer(partner.id, offer.id);
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      onOffersCountUpdated?.(offers.length - 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l'offre.");
    }
  }

  async function handleCreateEventFromOffer(offer: PartnerOffer) {
    try {
      setDraftLoadingId(offer.id);
      const draft = await fetchOfferEventDraft(offer.id);
      setActiveDraft(draft);
      setDraftOfferName(offer.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger le projet d'événement.");
    } finally {
      setDraftLoadingId(null);
    }
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!formData.name.trim()) {
      setFormError("Le nom de l'offre est obligatoire.");
      return;
    }
    if (!formData.title.en.trim()) {
      setFormError("Le titre en anglais (EN) est obligatoire pour l'API backend.");
      return;
    }
    if (formData.durationMinutes < 1 || formData.durationMinutes > 480) {
      setFormError("La durée doit être comprise entre 1 et 480 minutes (8 heures max).");
      return;
    }
    if (formData.maxParticipants < 1) {
      setFormError("Le nombre de participants doit être d'au moins 1.");
      return;
    }
    if (formData.minAge > formData.maxAge) {
      setFormError("L'âge minimum ne peut pas dépasser l'âge maximum.");
      return;
    }
    if (Number(formData.registrationFee) < 0) {
      setFormError("Le tarif d'inscription ne peut pas être négatif.");
      return;
    }

    try {
      setSaving(true);
      if (editingOfferId) {
        const updated = await updateOffer(partner.id, editingOfferId, formData);
        setOffers((prev) => prev.map((o) => (o.id === editingOfferId ? updated : o)));
      } else {
        const created = await createOffer(partner.id, formData);
        setOffers((prev) => [...prev, created]);
        onOffersCountUpdated?.(offers.length + 1);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'offre.");
    } finally {
      setSaving(false);
    }
  }

  function toggleWeekday(day: number) {
    setFormData((prev) => {
      const exists = prev.weekdays.includes(day);
      const next = exists ? prev.weekdays.filter((d) => d !== day) : [...prev.weekdays, day];
      return { ...prev, weekdays: next.sort((a, b) => a - b) };
    });
  }

  function toggleLanguage(lang: "en" | "de" | "fr") {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      const next = exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages: next };
    });
  }

  return (
    <div className="offers-tab-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Offres d'événements ({offers.length})</h3>
          <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
            Modèles d'événements réutilisables spécifiques à ce lieu. Plusieurs offres d'un même type sont possibles.
          </p>
        </div>
        <button type="button" className="button" onClick={handleOpenCreate}>
          + Créer une offre
        </button>
      </div>

      {error && (
        <div className="status-banner" style={{ marginBottom: "1.2rem", color: "var(--danger)" }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          Chargement des offres...
        </div>
      ) : offers.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "2.5rem" }}>
          <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>
            Aucune offre configurée pour ce partenaire.
          </p>
          <button type="button" className="button" onClick={handleOpenCreate}>
            + Créer la première offre
          </button>
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map((offer) => {
            const eventTypeInfo = EVENT_TYPE_MAP[offer.eventType] || {
              label: offer.eventType,
              icon: "🎟️",
            };
            const weekdaysText = (offer.weekdays || [])
              .map((d) => WEEKDAYS_MAP.find((w) => w.day === d)?.short || `J${d}`)
              .join(", ");

            return (
              <div
                key={offer.id}
                className={`offer-card${offer.isActive ? "" : " inactive"}`}
              >
                <div className="offer-card-head">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span className="offer-type-icon">{eventTypeInfo.icon}</span>
                    <div>
                      <h4 className="offer-title">{offer.name}</h4>
                      <span className="offer-type-label">{eventTypeInfo.label}</span>
                    </div>
                  </div>
                  <span className={`pill ${offer.isActive ? "active" : "paused"}`}>
                    {offer.isActive ? "Active" : "Désactivée"}
                  </span>
                </div>

                <div className="offer-meta-grid">
                  <div className="offer-meta-item">
                    <span className="meta-label">Créneau</span>
                    <span className="meta-val">
                      {weekdaysText || "Non fixé"}
                      {offer.startTime ? ` à ${offer.startTime}` : ""}
                    </span>
                  </div>

                  <div className="offer-meta-item">
                    <span className="meta-label">Durée</span>
                    <span className="meta-val">{offer.durationMinutes} min</span>
                  </div>

                  <div className="offer-meta-item">
                    <span className="meta-label">Capacité</span>
                    <span className="meta-val">
                      {offer.maxParticipants} pers.
                      {(offer.maxParticipantsM || offer.maxParticipantsF) && (
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block" }}>
                          ({offer.maxParticipantsM ?? "—"} H / {offer.maxParticipantsF ?? "—"} F)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="offer-meta-item">
                    <span className="meta-label">Tarif billet</span>
                    <span className="meta-val" style={{ fontWeight: 700 }}>
                      {Number(offer.registrationFee || 0).toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="offer-desc-preview">
                  <p>
                    <strong>Titre :</strong> {offer.title?.fr || offer.title?.en || "—"}
                  </p>
                  {offer.partnerCostNotes && (
                    <p style={{ marginTop: "0.3rem", color: "var(--muted)", fontSize: "0.82rem" }}>
                      💼 {offer.partnerCostNotes}
                    </p>
                  )}
                  <div className="offer-tags-row">
                    {(offer.languages || []).map((l) => (
                      <span key={l} className="mini-tag">
                        {l.toUpperCase()}
                      </span>
                    ))}
                    {offer.hasFoodComponent && <span className="mini-tag">🍽️ Food</span>}
                    {offer.allowPlusOnes && <span className="mini-tag">+1 autorisés</span>}
                    {offer.spaceUsed && <span className="mini-tag">📍 {offer.spaceUsed}</span>}
                  </div>
                </div>

                <div className="offer-actions">
                  <button
                    type="button"
                    className="button action-create-event"
                    disabled={draftLoadingId === offer.id}
                    onClick={() => handleCreateEventFromOffer(offer)}
                    title="Générer un brouillon MeetupEvent et lier au formulaire coach"
                  >
                    {draftLoadingId === offer.id ? "Chargement..." : "⚡ Créer un événement"}
                  </button>

                  <div className="offer-secondary-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEdit(offer)}
                      title="Modifier l'offre"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDuplicate(offer)}
                      title="Dupliquer l'offre"
                    >
                      📑
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleToggleActive(offer)}
                      title={offer.isActive ? "Désactiver l'offre" : "Activer l'offre"}
                    >
                      {offer.isActive ? "⏸️" : "▶️"}
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleDelete(offer)}
                      title="Supprimer l'offre"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {isModalOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
          <div className="partner-modal" role="dialog" aria-modal="true">
            <div className="partner-modal-head">
              <div>
                <h2>{editingOfferId ? "Modifier l'offre" : "Nouvelle Offre d'Événement"}</h2>
                <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
                  Pour : <strong>{partner.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="status-banner" style={{ margin: "1rem 1.5rem 0", color: "var(--danger)" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSaveOffer} className="partner-modal-form">
              <div className="form-section">
                <h3 className="form-section-title">Général & Format</h3>
                <div className="form-grid-2">
                  <label className="form-label">
                    <span>Nom interne de l'offre *</span>
                    <input
                      type="text"
                      required
                      placeholder="ex. Speed Dating Jeudi soir"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Type d'événement *</span>
                    <select
                      value={formData.eventType}
                      onChange={(e) =>
                        setFormData({ ...formData, eventType: e.target.value as OfferEventType })
                      }
                      className="form-select"
                    >
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Calendrier & Horaires</h3>
                <div className="form-label" style={{ marginBottom: "0.8rem" }}>
                  <span>Jours de la semaine habituels</span>
                  <div className="weekdays-selector">
                    {WEEKDAYS_MAP.map((w) => {
                      const selected = formData.weekdays.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          className={`weekday-pill${selected ? " active" : ""}`}
                          onClick={() => toggleWeekday(w.day)}
                        >
                          {w.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-grid-2">
                  <label className="form-label">
                    <span>Heure de début suggérée</span>
                    <input
                      type="time"
                      value={formData.startTime || ""}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Durée (minutes) *</span>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      required
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                      }
                      className="form-input"
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Capacité & Participants</h3>
                <div className="form-grid-2">
                  <label className="form-label">
                    <span>Capacité maximale totale *</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({ ...formData, maxParticipants: Number(e.target.value) })
                      }
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Tarif par participant (€) *</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={formData.registrationFee}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationFee: Number(e.target.value) })
                      }
                      className="form-input"
                    />
                  </label>
                </div>

                <div className="form-grid-3" style={{ marginTop: "0.8rem" }}>
                  <label className="form-label">
                    <span>Cap Hommes (optionnel)</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="—"
                      value={formData.maxParticipantsM ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxParticipantsM: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Cap Femmes (optionnel)</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="—"
                      value={formData.maxParticipantsF ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxParticipantsF: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Cap Non-binaire</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="—"
                      value={formData.maxParticipantsNb ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxParticipantsNb: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="form-input"
                    />
                  </label>
                </div>

                <div className="form-grid-2" style={{ marginTop: "0.8rem" }}>
                  <label className="form-label">
                    <span>Âge minimum</span>
                    <input
                      type="number"
                      min="18"
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) })}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Âge maximum</span>
                    <input
                      type="number"
                      min="18"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: Number(e.target.value) })}
                      className="form-input"
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <h3 className="form-section-title" style={{ margin: 0 }}>
                    Titres & Descriptions (Multilingue)
                  </h3>
                  <div className="lang-tabs">
                    <button
                      type="button"
                      className={`lang-tab-btn${activeLangTab === "fr" ? " active" : ""}`}
                      onClick={() => setActiveLangTab("fr")}
                    >
                      🇫🇷 FR
                    </button>
                    <button
                      type="button"
                      className={`lang-tab-btn${activeLangTab === "en" ? " active" : ""}`}
                      onClick={() => setActiveLangTab("en")}
                    >
                      🇬🇧 EN *
                    </button>
                    <button
                      type="button"
                      className={`lang-tab-btn${activeLangTab === "de" ? " active" : ""}`}
                      onClick={() => setActiveLangTab("de")}
                    >
                      🇩🇪 DE
                    </button>
                  </div>
                </div>

                <label className="form-label">
                  <span>Titre public ({activeLangTab.toUpperCase()}) {activeLangTab === "en" && "*"}</span>
                  <input
                    type="text"
                    required={activeLangTab === "en"}
                    placeholder={`Titre en ${activeLangTab.toUpperCase()}`}
                    value={formData.title[activeLangTab]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: { ...formData.title, [activeLangTab]: e.target.value },
                      })
                    }
                    className="form-input"
                  />
                </label>

                <label className="form-label" style={{ marginTop: "0.8rem" }}>
                  <span>Description ({activeLangTab.toUpperCase()})</span>
                  <textarea
                    rows={3}
                    placeholder={`Description de l'événement en ${activeLangTab.toUpperCase()}...`}
                    value={formData.description[activeLangTab]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: { ...formData.description, [activeLangTab]: e.target.value },
                      })
                    }
                    className="form-textarea"
                  />
                </label>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Logistique & Conditions Fournisseur</h3>
                <div className="form-grid-2">
                  <label className="form-label">
                    <span>Espace / Salle utilisée</span>
                    <input
                      type="text"
                      placeholder="ex. Salle voûtée, Bar principal"
                      value={formData.spaceUsed}
                      onChange={(e) => setFormData({ ...formData, spaceUsed: e.target.value })}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span>Consignes d'installation (setup)</span>
                    <input
                      type="text"
                      placeholder="ex. Accès 30 min avant, tables de 2"
                      value={formData.setupNotes}
                      onChange={(e) => setFormData({ ...formData, setupNotes: e.target.value })}
                      className="form-input"
                    />
                  </label>
                </div>

                <label className="form-label" style={{ marginTop: "0.8rem" }}>
                  <span>Coûts & Consommations partenaire</span>
                  <textarea
                    rows={2}
                    placeholder="ex. Pack 1 boisson incluse à 8€ par personne, ardoise minimale 200€..."
                    value={formData.partnerCostNotes}
                    onChange={(e) => setFormData({ ...formData, partnerCostNotes: e.target.value })}
                    className="form-textarea"
                  />
                </label>

                <div className="form-label" style={{ marginTop: "0.8rem" }}>
                  <span>Langues parlées à l'événement</span>
                  <div className="weekdays-selector">
                    {(["fr", "en", "de"] as const).map((l) => {
                      const sel = formData.languages.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          className={`weekday-pill${sel ? " active" : ""}`}
                          onClick={() => toggleLanguage(l)}
                        >
                          {l.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="checkbox-grid" style={{ marginTop: "0.8rem" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.hasFoodComponent}
                      onChange={(e) =>
                        setFormData({ ...formData, hasFoodComponent: e.target.checked })
                      }
                    />
                    <span>Composante restauration / tapas incluse</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.allowPlusOnes}
                      onChange={(e) =>
                        setFormData({ ...formData, allowPlusOnes: e.target.checked })
                      }
                    />
                    <span>Accompagnants (+1) autorisés</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <span>Offre active et sélectionnable</span>
                  </label>
                </div>
              </div>

              <div className="partner-modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button type="submit" className="button" disabled={saving}>
                  {saving ? "Enregistrement..." : editingOfferId ? "Mettre à jour l'offre" : "Créer l'offre"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* EVENT DRAFT PREVIEW MODAL */}
      <EventDraftModal
        draft={activeDraft}
        offerName={draftOfferName}
        onClose={() => setActiveDraft(null)}
      />
    </div>
  );
}
