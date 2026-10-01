"use client";

import Link from "next/link";
import { EVENT_TYPE_MAP } from "@/lib/constants/partners";
import type { LocationItem, OfferEventType, PartnerOffer } from "@/lib/types";

type Props = {
  partner: LocationItem;
  offers: PartnerOffer[];
  onCreateEventFromOffer: (offer: PartnerOffer) => void;
};

export function LinkedEventsTab({ partner, offers, onCreateEventFromOffer }: Props) {
  return (
    <div className="linked-events-tab-container">
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
          Événements & Billetterie associés à {partner.name}
        </h3>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
          Dans l'architecture Crush.lu, chaque événement <code>MeetupEvent</code> est rattaché à son partenaire
          (<code>MeetupEvent.partner</code>) et à l'offre modèle utilisée pour le créer (<code>MeetupEvent.offer</code>).
          Toutes les modifications apportées à l'offre ou au partenaire servent de gabarit de préremplissage sans jamais
          altérer les événements passés ou déjà publiés.
        </p>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>Offres disponibles pour programmation</h4>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>
              Sélectionnez une offre pour ouvrir instantanément le brouillon d'événement prérempli.
            </p>
          </div>
          <Link href="/events/coaches" className="button secondary" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}>
            Voir le planning coachs 🗓️
          </Link>
        </div>

        {offers.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic", margin: "1rem 0" }}>
            Aucune offre n'est encore définie pour ce partenaire. Créez d'abord une offre dans l'onglet "Offres".
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom de l'offre</th>
                  <th>Type</th>
                  <th>Créneau suggéré</th>
                  <th>Capacité</th>
                  <th>Tarif</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const eventTypeInfo = EVENT_TYPE_MAP[offer.eventType as OfferEventType] || {
                    label: offer.eventType,
                    icon: "🎟️",
                  };
                  return (
                    <tr key={offer.id}>
                      <td>
                        <strong>{offer.name}</strong>
                      </td>
                      <td>
                        <span className="pill" style={{ background: "rgba(99,102,241,0.12)", color: "var(--indigo-2)" }}>
                          {eventTypeInfo.icon} {eventTypeInfo.label}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                        {offer.startTime ? `Début à ${offer.startTime} (${offer.durationMinutes} min)` : "Non fixé"}
                      </td>
                      <td>{offer.maxParticipants} pers.</td>
                      <td>
                        <strong>{Number(offer.registrationFee || 0).toFixed(2)} €</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button"
                          style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
                          onClick={() => onCreateEventFromOffer(offer)}
                        >
                          ⚡ Créer l'événement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
