"use client";

import { useEffect, useState } from "react";
import {
  buildEventAdminUrl,
  fetchEventPartnerLink,
  fetchPartnerEvents,
  linkEventPartner,
} from "@/lib/api/locations";
import type { LocationItem, PartnerLinkedEvent, PartnerOffer } from "@/lib/types";

type Props = { partner: LocationItem; offers: PartnerOffer[] };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-LU", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Luxembourg",
  }).format(new Date(value));
}

function statusLabel(event: PartnerLinkedEvent) {
  if (event.isCancelled) return "Annulé";
  if (!event.isPublished) return "Brouillon";
  const start = new Date(event.dateTime).getTime();
  if (start + event.durationMinutes * 60_000 <= Date.now()) return "Passé";
  return start <= Date.now() ? "En cours" : "Publié";
}

export function LinkedEventsTab({ partner, offers }: Props) {
  const [events, setEvents] = useState<PartnerLinkedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [eventId, setEventId] = useState("");
  const [candidate, setCandidate] = useState<PartnerLinkedEvent | null>(null);
  const [offerId, setOfferId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    fetchPartnerEvents(partner.id, { includeUnlinked: true }).then((items) => {
      if (current) setEvents(items);
    }).catch(() => {
      if (current) setError("Impossible de charger les événements liés. Vérifiez la connexion et la disponibilité du service.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [partner.id, revision]);

  async function preview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setCandidate(null);
    setLinkError(null);
    setSuccess(null);
    try {
      const result = await fetchEventPartnerLink(eventId);
      setCandidate(result);
      setOfferId(result.partnerId === partner.id ? result.offerId || "" : "");
    } catch {
      setLinkError("Événement introuvable ou accès indisponible.");
    } finally { setBusy(false); }
  }

  async function confirmLink() {
    if (!candidate) return;
    setBusy(true);
    setLinkError(null);
    try {
      await linkEventPartner(candidate.id, partner.id, offerId || null);
      setSuccess(`L'événement « ${candidate.title} » est maintenant lié à ${partner.name}.`);
      setCandidate(null);
      setEventId("");
      setRevision((value) => value + 1);
    } catch {
      setLinkError("Le rattachement a échoué. Vérifiez vos droits et que l'événement n'est pas déjà lié à un autre partenaire.");
    } finally { setBusy(false); }
  }

  return (
    <div className="linked-events-tab-container">
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h3>Événements associés à {partner.name}</h3>
        <p>Les événements conservent leurs propres dates, tarifs et coordonnées. Modifier une offre ne modifie pas les événements existants.</p>
        {loading ? <p role="status">Chargement des événements…</p> : error ? (
          <div role="alert"><p>{error}</p><button className="button secondary" onClick={() => setRevision((value) => value + 1)}>Réessayer</button></div>
        ) : events.length === 0 ? <p>Aucun événement n'est encore rattaché à ce partenaire.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Événement</th><th>Date</th><th>Statut</th><th>Liaison</th><th>Offre</th><th>Places occupées</th><th>Candidatures / attente</th><th>Action</th></tr></thead>
              <tbody>{events.map((event) => (
                <tr key={event.id}>
                  <td><strong>{event.title}</strong><br />#{event.id}</td>
                  <td>{dateLabel(event.dateTime)}</td>
                  <td>{statusLabel(event)}</td>
                  <td>
                    {event.partnerId === partner.id ? (
                      <span className="pill" style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald-3, #059669)", fontSize: "0.78rem" }}>
                        ✅ Lié
                      </span>
                    ) : (
                      <span className="pill" style={{ background: "rgba(245,158,11,0.15)", color: "var(--amber-3, #d97706)", fontSize: "0.78rem" }} title="Associé automatiquement par le nom du lieu">
                        📍 Lieu associé
                      </span>
                    )}
                  </td>
                  <td>{event.offerName || "Offre non renseignée"}</td>
                  <td>{event.seatHolders} / {event.maxParticipants}<br />{event.attended} présents</td>
                  <td>{event.applications} / {event.waitlisted}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <a href={buildEventAdminUrl(event.id)} target="_blank" rel="noreferrer" style={{ whiteSpace: "nowrap" }}>Ouvrir ↗</a>
                      {!event.partnerId && (
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                          onClick={() => {
                            setEventId(event.id);
                            setCandidate(event);
                            setOfferId("");
                          }}
                        >
                          Confirmer liaison
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <div className="panel">
        <h3>Rattacher un événement existant</h3>
        <p>Vérifiez son titre, sa date et son lieu avant de confirmer. Seul le rattachement change.</p>
        {success && <p role="status" className="status-banner success">{success}</p>}
        {linkError && <p role="alert" className="status-banner error">{linkError}</p>}
        <form className="app-form" onSubmit={preview} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
          <label>Numéro de l'événement<br /><input type="number" min="1" step="1" required value={eventId} disabled={busy} onChange={(event) => { setEventId(event.target.value); setCandidate(null); }} /></label>
          <button className="button secondary" type="submit" disabled={busy}>{busy ? "Chargement…" : "Vérifier l'événement"}</button>
        </form>
        {candidate && (
          <div className="app-form" style={{ marginTop: "1rem" }}>
            <p><strong>{candidate.title}</strong> — {dateLabel(candidate.dateTime)}<br />Lieu enregistré : {candidate.location} · {statusLabel(candidate)}</p>
            {candidate.partnerId && candidate.partnerId !== partner.id ? (
              <p role="alert">Cet événement est déjà lié à un autre partenaire. Vérifiez son rattachement dans l'administration.</p>
            ) : (
              <>
                <label>Offre utilisée (facultatif)<br />
                  <select value={offerId} disabled={busy} onChange={(event) => setOfferId(event.target.value)}>
                    <option value="">Origine inconnue — ne pas attribuer d'offre</option>
                    {offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.name}{offer.isActive ? "" : " (inactive)"}</option>)}
                  </select>
                </label>
                <p><button className="button" disabled={busy} onClick={confirmLink}>Confirmer le rattachement à {partner.name}</button></p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
