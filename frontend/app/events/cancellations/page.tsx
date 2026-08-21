"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  fetchCancelledEvents,
  fetchEventCancellationDetail,
} from "@/lib/api/events";
import type {
  EventCancellationRegistration,
  EventCancellationSummary,
} from "@/lib/types";

const eurFmt = new Intl.NumberFormat("fr-LU", {
  style: "currency",
  currency: "EUR",
});
const formatEUR = (cents: number) => eurFmt.format(cents / 100);

const dateFmt = new Intl.DateTimeFormat("fr-LU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatDate = (iso: string) => (iso ? dateFmt.format(new Date(iso)) : "—");

export default function EventCancellationsPage() {
  const [events, setEvents] = useState<EventCancellationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    event: EventCancellationSummary;
    registrations: EventCancellationRegistration[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCancelledEvents();
        if (mounted) {
          setEvents(data);
        }
      } catch {
        if (mounted) {
          setError("Impossible de charger les événements annulés.");
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

  const handleSelectEvent = async (eventId: string) => {
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setSelectedDetail(null);
      return;
    }
    setSelectedEventId(eventId);
    try {
      setLoadingDetail(true);
      const detail = await fetchEventCancellationDetail(eventId);
      setSelectedDetail(detail);
    } catch {
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const metrics = useMemo(() => {
    const totalCancelled = events.length;
    const totalAffectedRegs = events.reduce(
      (s, e) => s + (e.affectedRegistrations || 0),
      0,
    );
    const totalCreditsCents = events.reduce(
      (s, e) => s + (e.issuedCreditsTotalCents || 0),
      0,
    );
    const totalOpenCashCents = events.reduce(
      (s, e) => s + (e.openCashRefundTotalCents || 0),
      0,
    );

    return [
      { label: "Événements annulés", value: String(totalCancelled) },
      { label: "Places impactées", value: String(totalAffectedRegs) },
      { label: "Crush Credit émis", value: formatEUR(totalCreditsCents) },
      { label: "Remboursements cash ouverts", value: formatEUR(totalOpenCashCents) },
    ];
  }, [events]);

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="🎟️ Événements & Billetterie"
        title="Annulations & Crédits Crush"
        description="Supervision en temps réel des événements annulés, des avoirs Crush Credit émis et de la file des demandes de remboursement."
      />

      <HeroStats metrics={metrics} />

      {error ? (
        <div className="panel" style={{ color: "var(--danger)", padding: "1rem" }}>
          ⚠️ {error}
        </div>
      ) : null}

      <Panel
        title="Événements annulés"
        description="Cliquez sur une ligne pour inspecter les participants inscrits et le statut des crédits associés."
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Chargement des événements annulés...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Aucun événement annulé répertorié.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Type</th>
                  <th>Date prévue</th>
                  <th>Annulé le</th>
                  <th>Inscrits</th>
                  <th>Crédits émis</th>
                  <th>File Cash</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedEventId === e.id
                          ? "var(--surface-active)"
                          : undefined,
                    }}
                    onClick={() => void handleSelectEvent(e.id)}
                  >
                    <td>
                      <strong>{e.title}</strong>
                    </td>
                    <td>{e.eventType || "—"}</td>
                    <td>{formatDate(e.dateTime)}</td>
                    <td>
                      {e.organiserCancellationStartedAt
                        ? formatDate(e.organiserCancellationStartedAt)
                        : "—"}
                    </td>
                    <td>
                      <span className="count-badge">
                        {e.affectedRegistrations}
                      </span>
                    </td>
                    <td>
                      <strong>{formatEUR(e.issuedCreditsTotalCents)}</strong> (
                      {e.issuedCreditsCount} crédits)
                    </td>
                    <td>
                      {e.openCashRefundTotalCents > 0 ? (
                        <span
                          className="pill"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                          }}
                        >
                          {formatEUR(e.openCashRefundTotalCents)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>0,00 €</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                      >
                        {selectedEventId === e.id ? "Masquer" : "Détails"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedEventId && (
        <Panel
          title={
            selectedDetail
              ? `Participants impactés — ${selectedDetail.event.title}`
              : "Détails de l'annulation"
          }
          description="Liste des participants avec état du paiement, avoir Crush Credit et éligibilité au remboursement bancaire."
        >
          {loadingDetail ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)" }}>
              Chargement des inscriptions et crédits...
            </div>
          ) : !selectedDetail || selectedDetail.registrations.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)" }}>
              Aucune inscription auto-annulée trouvée pour cet événement.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email Membre</th>
                    <th>Origine Annulation</th>
                    <th>Statut</th>
                    <th>Crush Credit Lié</th>
                    <th>Remboursement & Demande Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetail.registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <strong>{reg.userEmail || "Anonyme / ID " + reg.id}</strong>
                      </td>
                      <td>
                        {reg.cancellationOrigin === "member" && reg.cancelledAt ? (
                          <div>
                            <span
                              className="pill"
                              style={{
                                background: "rgba(99, 102, 241, 0.15)",
                                color: "#6366f1",
                                fontWeight: 500,
                              }}
                            >
                              👤 Auto-annulation membre
                            </span>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--muted)",
                                marginTop: "0.2rem",
                              }}
                            >
                              {formatDate(reg.cancelledAt)}
                            </div>
                          </div>
                        ) : (
                          <span
                            className="pill"
                            style={{
                              background: "rgba(107, 114, 128, 0.15)",
                              color: "var(--muted)",
                            }}
                          >
                            🏢 Annulation organisateur
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="pill">{reg.status}</span>
                      </td>
                      <td>
                        {reg.credit ? (
                          reg.credit.status === "active" ? (
                            <span
                              className="pill"
                              style={{
                                background: "rgba(16, 185, 129, 0.15)",
                                color: "#10b981",
                                fontWeight: 600,
                              }}
                            >
                              💳 {formatEUR(reg.credit.amountCents)} (actif)
                            </span>
                          ) : reg.credit.status === "void" ? (
                            <span
                              className="pill"
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                              }}
                            >
                              🚫 {formatEUR(reg.credit.amountCents)} (désactivé)
                            </span>
                          ) : (
                            <span className="pill">
                              {formatEUR(reg.credit.amountCents)} ({reg.credit.status})
                            </span>
                          )
                        ) : (
                          <span style={{ color: "var(--muted)" }}>Aucun crédit</span>
                        )}
                      </td>
                      <td>
                        {reg.paymentStatus === "refunded" ||
                        (reg.credit?.status === "void" &&
                          (reg.credit?.note || "").toLowerCase().includes("refund")) ? (
                          <span
                            className="pill"
                            style={{
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            🟢 ✓ Remboursé SumUp{" "}
                            {reg.refundAmountCents
                              ? `(${formatEUR(reg.refundAmountCents)})`
                              : reg.credit
                              ? `(${formatEUR(reg.credit.amountCents)})`
                              : ""}
                          </span>
                        ) : reg.openCashRefund ? (
                          <span
                            className="pill"
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              fontWeight: 600,
                            }}
                          >
                            🟠 ⚠️ En attente de virement{" "}
                            {reg.credit ? `(${formatEUR(reg.credit.amountCents)})` : ""}
                          </span>
                        ) : reg.credit && reg.credit.status === "active" ? (
                          <span
                            className="pill"
                            style={{
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#3b82f6",
                            }}
                          >
                            🔵 Avoir conservé (non cash)
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>
                            ⚪ Non débité / Pas de cash dû
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </main>
  );
}
