"use client";

import { useState } from "react";
import { updateLocation } from "@/lib/api/locations";
import {
  EVENT_TYPE_OPTIONS,
  LUXEMBOURG_CANTONS,
  STAGE_OPTIONS,
} from "@/lib/constants/partners";
import type {
  CrushEventType,
  LocationItem,
  PartnerContact,
  PartnershipStage,
} from "@/lib/types";

type Props = {
  partner: LocationItem;
  onPartnerUpdated: (updated: LocationItem) => void;
};

export function PartnerInfoTab({ partner, onPartnerUpdated }: Props) {
  // Main form state
  const [name, setName] = useState(partner.name || "");
  const [stage, setStage] = useState<PartnershipStage>(partner.partnershipStage);
  const [maxCapacity, setMaxCapacity] = useState<number>(partner.maxCapacity || 40);
  const [seatedCapacity, setSeatedCapacity] = useState<string>(
    partner.seatedCapacity !== undefined ? String(partner.seatedCapacity) : "",
  );
  const [addressStreet, setAddressStreet] = useState(partner.addressStreet || "");
  const [addressNumber, setAddressNumber] = useState(partner.addressNumber || "");
  const [addressPostcode, setAddressPostcode] = useState(partner.addressPostcode || "");
  const [addressTown, setAddressTown] = useState(partner.addressTown || partner.city || "");
  const [canton, setCanton] = useState<string>(partner.canton || "Luxembourg");
  const [latitude, setLatitude] = useState<string>(
    partner.latitude !== undefined && partner.latitude !== null ? String(partner.latitude) : "",
  );
  const [longitude, setLongitude] = useState<string>(
    partner.longitude !== undefined && partner.longitude !== null ? String(partner.longitude) : "",
  );

  const [website, setWebsite] = useState(partner.website || "");
  const [openingHours, setOpeningHours] = useState(partner.openingHours || "");
  const [blackoutNotes, setBlackoutNotes] = useState(partner.blackoutNotes || "");
  const [houseRules, setHouseRules] = useState(partner.houseRules || "");

  const [hasOutdoorSpace, setHasOutdoorSpace] = useState(partner.hasOutdoorSpace);
  const [hasKitchen, setHasKitchen] = useState(partner.hasKitchen);
  const [hasPrivateRoom, setHasPrivateRoom] = useState(partner.hasPrivateRoom);
  const [hasSoundSystem, setHasSoundSystem] = useState(partner.hasSoundSystem);
  const [compatibleEventTypes, setCompatibleEventTypes] = useState<string[]>(
    partner.compatibleEventTypes || [],
  );

  const [accountManager, setAccountManager] = useState(partner.accountManager || "");
  const [partnerSince, setPartnerSince] = useState(partner.partnerSince || "");
  const [commercialTerms, setCommercialTerms] = useState(partner.commercialTerms || "");
  const [minimumSpend, setMinimumSpend] = useState<string>(
    partner.minimumSpend !== undefined && partner.minimumSpend !== null
      ? String(partner.minimumSpend)
      : "",
  );
  const [revenueSharePercent, setRevenueSharePercent] = useState<string>(
    partner.revenueSharePercent !== undefined && partner.revenueSharePercent !== null
      ? String(partner.revenueSharePercent)
      : "",
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    partner.depositAmount !== undefined && partner.depositAmount !== null
      ? String(partner.depositAmount)
      : "",
  );

  const [lastContactDate, setLastContactDate] = useState(partner.lastContactDate || "");
  const [nextAction, setNextAction] = useState(partner.nextAction || "");
  const [nextActionDate, setNextActionDate] = useState(partner.nextActionDate || "");
  const [notes, setNotes] = useState(partner.notes || "");
  const [tagsInput, setTagsInput] = useState((partner.tags || []).join(", "));

  // Contacts state
  const initialContacts: PartnerContact[] =
    partner.contacts && partner.contacts.length > 0
      ? partner.contacts
      : partner.primaryContact?.name
        ? [
            {
              name: partner.primaryContact.name,
              role: partner.primaryContact.role,
              email: partner.primaryContact.email,
              phone: partner.primaryContact.phone,
              isPrimary: true,
            },
          ]
        : [];
  const [contacts, setContacts] = useState<PartnerContact[]>(initialContacts);

  // New Contact inline form state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactIsPrimary, setNewContactIsPrimary] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleEventType(typeValue: string) {
    setCompatibleEventTypes((prev) =>
      prev.includes(typeValue) ? prev.filter((t) => t !== typeValue) : [...prev, typeValue],
    );
  }

  function handleSetPrimaryContact(index: number) {
    setContacts((prev) =>
      prev.map((c, i) => ({
        ...c,
        isPrimary: i === index,
      })),
    );
  }

  function handleRemoveContact(index: number) {
    setContacts((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // If we removed the primary contact, assign primary to the first one if available
      if (filtered.length > 0 && !filtered.some((c) => c.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  }

  function handleAddContact() {
    if (!newContactName.trim()) return;

    const newContact: PartnerContact = {
      name: newContactName.trim(),
      role: newContactRole.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim(),
      isPrimary: newContactIsPrimary || contacts.length === 0,
    };

    setContacts((prev) => {
      let next = [...prev];
      if (newContact.isPrimary) {
        next = next.map((c) => ({ ...c, isPrimary: false }));
      }
      return [...next, newContact];
    });

    setNewContactName("");
    setNewContactRole("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactIsPrimary(false);
    setIsAddingContact(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Le nom de l'établissement est requis.");
      return;
    }
    if (maxCapacity < 1) {
      setError("La capacité maximale doit être d'au moins 1.");
      return;
    }
    if (seatedCapacity && Number(seatedCapacity) > maxCapacity) {
      setError("La capacité assise ne peut pas dépasser la capacité maximale.");
      return;
    }
    if (addressPostcode && !/^[0-9]{4}$/.test(addressPostcode.trim())) {
      setError("Le code postal luxembourgeois doit être composé de 4 chiffres.");
      return;
    }
    if (
      revenueSharePercent &&
      (Number(revenueSharePercent) < 0 || Number(revenueSharePercent) > 100)
    ) {
      setError("Le pourcentage de partage de revenus doit être entre 0 et 100%.");
      return;
    }

    try {
      setSaving(true);
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<LocationItem> = {
        name: name.trim(),
        partnershipStage: stage,
        maxCapacity: Number(maxCapacity),
        seatedCapacity: seatedCapacity ? Number(seatedCapacity) : undefined,
        addressStreet: addressStreet.trim(),
        addressNumber: addressNumber.trim(),
        addressPostcode: addressPostcode.trim(),
        addressTown: addressTown.trim(),
        city: addressTown.trim() || partner.city,
        canton,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        website: website.trim(),
        openingHours: openingHours.trim(),
        blackoutNotes: blackoutNotes.trim(),
        houseRules: houseRules.trim(),
        hasOutdoorSpace,
        hasKitchen,
        hasPrivateRoom,
        hasSoundSystem,
        compatibleEventTypes: compatibleEventTypes as CrushEventType[],
        accountManager: accountManager.trim(),
        partnerSince: partnerSince || undefined,
        commercialTerms: commercialTerms.trim(),
        minimumSpend: minimumSpend ? Number(minimumSpend) : undefined,
        revenueSharePercent: revenueSharePercent ? Number(revenueSharePercent) : undefined,
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        lastContactDate,
        nextAction: nextAction.trim(),
        nextActionDate: nextActionDate || undefined,
        notes: notes.trim(),
        tags: parsedTags,
        contacts: contacts.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          name: c.name.trim(),
          role: c.role?.trim() || "",
          email: c.email?.trim() || "",
          phone: c.phone?.trim() || "",
          isPrimary: Boolean(c.isPrimary),
        })),
      };

      const updated = await updateLocation(partner.id, payload);
      onPartnerUpdated(updated);
      setSuccess("Modifications enregistrées avec succès.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="partner-info-form">
      {error && (
        <div className="status-banner" style={{ marginBottom: "1rem", color: "var(--danger)" }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="status-banner success" style={{ marginBottom: "1rem" }}>
          ✓ {success}
        </div>
      )}

      {/* SECTION 1: ÉTABLISSEMENT & CONTACTS */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="form-panel-title">1. Informations Générales & Statut</h3>
        <div className="form-grid-3">
          <label className="form-label" style={{ gridColumn: "span 2" }}>
            <span>Nom de l'établissement *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Statut du partenariat</span>
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

        <div className="form-grid-3" style={{ marginTop: "1rem" }}>
          <label className="form-label">
            <span>Responsable de compte (Staff)</span>
            <input
              type="text"
              placeholder="ex. Tom / Wesley"
              value={accountManager}
              onChange={(e) => setAccountManager(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Partenaire depuis le</span>
            <input
              type="date"
              value={partnerSince}
              onChange={(e) => setPartnerSince(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Site web officiel</span>
            <input
              type="url"
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="form-input"
            />
          </label>
        </div>
      </div>

      {/* SECTION 2: ADRESSE STRUCTURÉE */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="form-panel-title">2. Adresse Structurée & Localisation</h3>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: "0.85rem" }}>
          Champs répliqués sur les événements MeetupEvent pour le calcul cartographique et la communication publique.
        </p>

        <div className="form-grid-3">
          <label className="form-label" style={{ gridColumn: "span 2" }}>
            <span>Rue (address_street)</span>
            <input
              type="text"
              placeholder="Rue du Nord"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Numéro (address_number)</span>
            <input
              type="text"
              placeholder="7"
              value={addressNumber}
              onChange={(e) => setAddressNumber(e.target.value)}
              className="form-input"
            />
          </label>
        </div>

        <div className="form-grid-3" style={{ marginTop: "0.8rem" }}>
          <label className="form-label">
            <span>Code postal (exactement 4 chiffres)</span>
            <input
              type="text"
              placeholder="2229"
              maxLength={4}
              value={addressPostcode}
              onChange={(e) => setAddressPostcode(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Localité / Ville (address_town)</span>
            <input
              type="text"
              placeholder="Luxembourg"
              value={addressTown}
              onChange={(e) => setAddressTown(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Canton officiel</span>
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

        <div className="form-grid-2" style={{ marginTop: "0.8rem" }}>
          <label className="form-label">
            <span>Latitude GPS</span>
            <input
              type="number"
              step="any"
              placeholder="49.611600"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Longitude GPS</span>
            <input
              type="number"
              step="any"
              placeholder="6.131900"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="form-input"
            />
          </label>
        </div>

        <div className="form-grid-2" style={{ marginTop: "0.8rem" }}>
          <label className="form-label">
            <span>Horaires d'ouverture habituels</span>
            <input
              type="text"
              placeholder="Mardi–Samedi : 17h–01h"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Périodes d'indisponibilité / Blackout</span>
            <input
              type="text"
              placeholder="Fermé en août, indisponible veille de jours fériés"
              value={blackoutNotes}
              onChange={(e) => setBlackoutNotes(e.target.value)}
              className="form-input"
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: CAPACITÉS & ÉQUIPEMENTS */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="form-panel-title">3. Capacités d'Accueil & Équipements</h3>
        <div className="form-grid-2">
          <label className="form-label">
            <span>Capacité Maximale Totale (debout) *</span>
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
            <span>Places assises disponibles</span>
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

        <div className="checkbox-grid" style={{ marginTop: "1rem" }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasOutdoorSpace}
              onChange={(e) => setHasOutdoorSpace(e.target.checked)}
            />
            <span>Terrasse / Espace extérieur</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasKitchen}
              onChange={(e) => setHasKitchen(e.target.checked)}
            />
            <span>Cuisine équipée / Restauration</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasPrivateRoom}
              onChange={(e) => setHasPrivateRoom(e.target.checked)}
            />
            <span>Espace privatisable / Salle dédiée</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasSoundSystem}
              onChange={(e) => setHasSoundSystem(e.target.checked)}
            />
            <span>Système son / Microphones</span>
          </label>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label className="form-label">
            <span>Types d'événements adaptés</span>
            <div className="checkbox-grid" style={{ marginTop: "0.4rem" }}>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={compatibleEventTypes.includes(opt.value)}
                    onChange={() => toggleEventType(opt.value)}
                  />
                  <span>
                    {opt.icon} {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 4: CONTACTS DU LIEU */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 className="form-panel-title" style={{ margin: 0 }}>
              4. Contacts de l'Établissement ({contacts.length})
            </h3>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              Interlocuteurs commerciaux et opérationnels. Un seul contact doit être désigné comme principal.
            </p>
          </div>
          {!isAddingContact && (
            <button
              type="button"
              className="button secondary"
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
              onClick={() => setIsAddingContact(true)}
            >
              + Ajouter un contact
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic", margin: "0.5rem 0" }}>
            Aucun contact enregistré pour ce partenaire.
          </p>
        ) : (
          <div className="contacts-list">
            {contacts.map((contact, idx) => (
              <div key={contact.id || idx} className={`contact-card${contact.isPrimary ? " primary" : ""}`}>
                <div className="contact-card-main">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <strong>{contact.name}</strong>
                    {contact.role && <span className="contact-role">({contact.role})</span>}
                    {contact.isPrimary && (
                      <span className="pill active" style={{ fontSize: "0.72rem" }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="contact-coordinates">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`}>✉️ {contact.email}</a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>📞 {contact.phone}</a>
                    )}
                  </div>
                </div>

                <div className="contact-actions">
                  {!contact.isPrimary && (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => handleSetPrimaryContact(idx)}
                    >
                      Définir comme principal
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => handleRemoveContact(idx)}
                    title="Supprimer ce contact"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddingContact && (
          <div className="add-contact-box">
            <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.95rem" }}>Ajouter un nouveau contact</h4>
            <div className="form-grid-2">
              <label className="form-label">
                <span>Nom complet *</span>
                <input
                  type="text"
                  placeholder="ex. Julie Weber"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Rôle / Fonction</span>
                <input
                  type="text"
                  placeholder="ex. Responsable Bar / Événements"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-grid-2" style={{ marginTop: "0.6rem" }}>
              <label className="form-label">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="julie@bar.lu"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>Téléphone</span>
                <input
                  type="tel"
                  placeholder="+352 691 ..."
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>

            <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newContactIsPrimary}
                  onChange={(e) => setNewContactIsPrimary(e.target.checked)}
                />
                <span>Définir comme contact principal</span>
              </label>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  onClick={() => setIsAddingContact(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  onClick={handleAddContact}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: ACCORD COMMERCIAL & DEAL STRUCTURE */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="form-panel-title">5. Accord Commercial, Rémunération & Règlement</h3>
        <div className="form-grid-3">
          <label className="form-label">
            <span>Minimum spend garanti (€)</span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex. 250"
              value={minimumSpend}
              onChange={(e) => setMinimumSpend(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Partage de revenus (%)</span>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              placeholder="ex. 15"
              value={revenueSharePercent}
              onChange={(e) => setRevenueSharePercent(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Acompte / Caution versée (€)</span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ex. 100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="form-input"
            />
          </label>
        </div>

        <label className="form-label" style={{ marginTop: "1rem" }}>
          <span>Conditions commerciales détaillées (commercial_terms)</span>
          <textarea
            rows={2}
            placeholder="Détails de l'accord verbal ou écrit, conditions d'annulation, formule boisson..."
            value={commercialTerms}
            onChange={(e) => setCommercialTerms(e.target.value)}
            className="form-textarea"
          />
        </label>

        <label className="form-label" style={{ marginTop: "1rem" }}>
          <span>Règlement intérieur & Contraintes d'exploitation (house_rules)</span>
          <textarea
            rows={2}
            placeholder="Volume sono max, fin de service à minuit, tables à ranger par le coach..."
            value={houseRules}
            onChange={(e) => setHouseRules(e.target.value)}
            className="form-textarea"
          />
        </label>
      </div>

      {/* SECTION 6: SUIVI CRM */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="form-panel-title">6. Suivi CRM, Prochaines Actions & Tags</h3>
        <div className="form-grid-3">
          <label className="form-label">
            <span>Dernier contact</span>
            <input
              type="date"
              value={lastContactDate}
              onChange={(e) => setLastContactDate(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Prochaine action</span>
            <input
              type="text"
              placeholder="ex. Envoyer la confirmation de date"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            <span>Date de la prochaine action</span>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className="form-input"
            />
          </label>
        </div>

        <label className="form-label" style={{ marginTop: "1rem" }}>
          <span>Tags (séparés par des virgules)</span>
          <input
            type="text"
            placeholder="bar, cosy, centre-ville, terrasse, cocktail"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="form-input"
          />
        </label>

        <label className="form-label" style={{ marginTop: "1rem" }}>
          <span>Notes internes</span>
          <textarea
            rows={3}
            placeholder="Historique des échanges, impressions du staff..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
          />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
        <button type="submit" className="button" disabled={saving}>
          {saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
