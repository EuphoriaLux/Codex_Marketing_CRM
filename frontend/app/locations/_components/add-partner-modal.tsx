"use client";

import { useState } from "react";
import { LUXEMBOURG_CANTONS, STAGE_OPTIONS } from "@/lib/constants/partners";
import { createLocation } from "@/lib/api/locations";
import type { LocationItem, PartnershipStage } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (created: LocationItem) => void;
};

export function AddPartnerModal({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [maxCapacity, setMaxCapacity] = useState<number>(40);
  const [seatedCapacity, setSeatedCapacity] = useState<string>("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");
  const [addressTown, setAddressTown] = useState("");
  const [canton, setCanton] = useState<string>("Luxembourg");
  const [stage, setStage] = useState<PartnershipStage>("Prospect");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [hasOutdoorSpace, setHasOutdoorSpace] = useState(false);
  const [hasKitchen, setHasKitchen] = useState(false);
  const [hasPrivateRoom, setHasPrivateRoom] = useState(false);
  const [hasSoundSystem, setHasSoundSystem] = useState(false);
  const [commercialTerms, setCommercialTerms] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de l'établissement est requis.");
      return;
    }
    if (!maxCapacity || maxCapacity < 1) {
      setError("La capacité maximale doit être d'au moins 1 personne.");
      return;
    }
    if (seatedCapacity && Number(seatedCapacity) > maxCapacity) {
      setError("La capacité assise ne peut pas dépasser la capacité maximale.");
      return;
    }
    if (addressPostcode && !/^[0-9]{4}$/.test(addressPostcode.trim())) {
      setError("Le code postal luxembourgeois doit être composé d'exactement 4 chiffres.");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<LocationItem> = {
        name: name.trim(),
        maxCapacity: Number(maxCapacity),
        seatedCapacity: seatedCapacity ? Number(seatedCapacity) : undefined,
        addressStreet: addressStreet.trim(),
        addressNumber: addressNumber.trim(),
        addressPostcode: addressPostcode.trim(),
        addressTown: addressTown.trim() || "Luxembourg",
        city: addressTown.trim() || "Luxembourg",
        country: "Luxembourg",
        canton,
        partnershipStage: stage,
        hasOutdoorSpace,
        hasKitchen,
        hasPrivateRoom,
        hasSoundSystem,
        commercialTerms: commercialTerms.trim(),
        notes: "",
        tags: [],
        contacts: contactName.trim()
          ? [
              {
                name: contactName.trim(),
                role: contactRole.trim(),
                email: contactEmail.trim(),
                phone: contactPhone.trim(),
                isPrimary: true,
              },
            ]
          : [],
      };

      const created = await createLocation(payload);
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du partenaire.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="partner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-partner-title"
      >
        <div className="partner-modal-head">
          <div>
            <h2 id="add-partner-title">Nouveau Partenaire</h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
              Enregistrez un nouveau bar, restaurant ou salle partenaire.
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

        {error && (
          <div className="status-banner" style={{ margin: "1rem 1.5rem 0", color: "var(--danger)", borderColor: "var(--danger)" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="partner-modal-form">
          <div className="form-section">
            <h3 className="form-section-title">Établissement</h3>
            <div className="form-grid-2">
              <label className="form-label">
                <span>Nom de l'établissement *</span>
                <input
                  type="text"
                  required
                  placeholder="ex. Konrad Café & Bar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Statut dans le pipeline</span>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as PartnershipStage)}
                  className="form-select"
                >
                  {STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-grid-2" style={{ marginTop: "0.8rem" }}>
              <label className="form-label">
                <span>Capacité maximale (debout) *</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Places assises</span>
                <input
                  type="number"
                  min="1"
                  max={maxCapacity}
                  placeholder="Optionnel"
                  value={seatedCapacity}
                  onChange={(e) => setSeatedCapacity(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Adresse & Localisation (Luxembourg)</h3>
            <div className="form-grid-3">
              <label className="form-label" style={{ gridColumn: "span 2" }}>
                <span>Rue</span>
                <input
                  type="text"
                  placeholder="ex. Rue du Nord"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Numéro</span>
                <input
                  type="text"
                  placeholder="ex. 7"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-grid-3" style={{ marginTop: "0.8rem" }}>
              <label className="form-label">
                <span>Code postal (4 chiffres)</span>
                <input
                  type="text"
                  placeholder="ex. 2229"
                  maxLength={4}
                  value={addressPostcode}
                  onChange={(e) => setAddressPostcode(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Localité / Ville</span>
                <input
                  type="text"
                  placeholder="ex. Luxembourg"
                  value={addressTown}
                  onChange={(e) => setAddressTown(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Canton</span>
                <select
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  className="form-select"
                >
                  {LUXEMBOURG_CANTONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Contact Principal</h3>
            <div className="form-grid-2">
              <label className="form-label">
                <span>Nom complet</span>
                <input
                  type="text"
                  placeholder="ex. Marion Dupont"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Rôle / Fonction</span>
                <input
                  type="text"
                  placeholder="ex. Gérante / Propriétaire"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-grid-2" style={{ marginTop: "0.8rem" }}>
              <label className="form-label">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="contact@etablissement.lu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Téléphone</span>
                <input
                  type="tel"
                  placeholder="+352 691 123 456"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Équipements & Prestations</h3>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasOutdoorSpace}
                  onChange={(e) => setHasOutdoorSpace(e.target.checked)}
                />
                <span>Terrasse / Extérieur</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasKitchen}
                  onChange={(e) => setHasKitchen(e.target.checked)}
                />
                <span>Cuisine / Restauration</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPrivateRoom}
                  onChange={(e) => setHasPrivateRoom(e.target.checked)}
                />
                <span>Espace privatisable</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasSoundSystem}
                  onChange={(e) => setHasSoundSystem(e.target.checked)}
                />
                <span>Sono / Micro</span>
              </label>
            </div>

            <label className="form-label" style={{ marginTop: "0.8rem" }}>
              <span>Conditions commerciales initiales (notes)</span>
              <textarea
                rows={2}
                placeholder="ex. Minimum spend 250€ le jeudi, 15% commission billets..."
                value={commercialTerms}
                onChange={(e) => setCommercialTerms(e.target.value)}
                className="form-textarea"
              />
            </label>
          </div>

          <div className="partner-modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? "Création en cours..." : "Créer le partenaire"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
