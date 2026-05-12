"use client";

import { useMemo, useState } from "react";
import { HeroStats } from "@/components/hero-stats";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { useHubData } from "@/lib/hub-provider";
import type { PaymentStatus } from "@/lib/types";

type Period = "this-month" | "next-month" | "all";

const eurFmt = new Intl.NumberFormat("fr-LU", {
  style: "currency",
  currency: "EUR",
});
const formatEUR = (n: number) => eurFmt.format(n);

const dateFmt = new Intl.DateTimeFormat("fr-LU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const formatDate = (iso: string) => dateFmt.format(new Date(iso));

const timelineDateFmt = new Intl.DateTimeFormat("fr-LU", {
  day: "2-digit",
  month: "short",
});

const pillClass = (status: PaymentStatus) => `pill ${status.toLowerCase()}`;

function inPeriod(iso: string, period: Period): boolean {
  if (period === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  const target =
    period === "this-month"
      ? now
      : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth()
  );
}

export default function AccountingPage() {
  const { paymentsIn, paymentsOut, payroll, locations } = useHubData();
  const [period, setPeriod] = useState<Period>("all");

  const filteredIn = useMemo(
    () => paymentsIn.filter((p) => inPeriod(p.date, period)),
    [paymentsIn, period],
  );
  const filteredOut = useMemo(
    () => paymentsOut.filter((p) => inPeriod(p.date, period)),
    [paymentsOut, period],
  );
  const filteredPay = useMemo(
    () => payroll.filter((p) => inPeriod(p.date, period)),
    [payroll, period],
  );

  const locationName = (id?: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  const metrics = useMemo(() => {
    const toReceive = filteredIn
      .filter((p) => p.status !== "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const toPay = filteredOut
      .filter((p) => p.status !== "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const wages = filteredPay
      .filter((p) => p.status !== "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const forecast = toReceive - toPay - wages;

    return [
      { label: "À recevoir", value: formatEUR(toReceive) },
      { label: "À payer", value: formatEUR(toPay) },
      { label: "Masse salariale", value: formatEUR(wages) },
      { label: "Solde prévisionnel", value: formatEUR(forecast) },
    ];
  }, [filteredIn, filteredOut, filteredPay]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incoming = filteredIn.map((p) => ({
      id: `in-${p.id}`,
      dateISO: p.date,
      title: `Encaissement — ${p.source}`,
      description: `${formatEUR(p.amount)} · ${p.status}`,
    }));
    const outgoing = filteredOut.map((p) => ({
      id: `out-${p.id}`,
      dateISO: p.date,
      title: `Versement — ${p.locationId ? locationName(p.locationId) : p.payee}`,
      description: `${formatEUR(p.amount)} · ${p.description}`,
    }));
    const wages = filteredPay.map((p) => ({
      id: `pay-${p.id}`,
      dateISO: p.date,
      title: `${p.category} — ${p.employeeName}`,
      description: `${formatEUR(p.amount)} · ${p.description}`,
    }));

    return [...incoming, ...outgoing, ...wages]
      .filter((e) => new Date(e.dateISO) >= today)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .slice(0, 6)
      .map((e) => ({
        ...e,
        dateLabel: timelineDateFmt.format(new Date(e.dateISO)),
      }));
  }, [filteredIn, filteredOut, filteredPay, locations]);

  return (
    <main className="page">
      <SectionHeader
        eyebrow="Comptabilité"
        title="Paiements, dépenses et trésorerie en un coup d'œil."
        description="Vue d'ensemble des encaissements, des versements aux partenaires et de la masse salariale, regroupés pour le comptable."
      />

      <section
        className="panel"
        style={{
          display: "flex",
          gap: "0.8rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label htmlFor="period" style={{ fontWeight: 600 }}>
          Période :
        </label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
        >
          <option value="all">Toutes</option>
          <option value="this-month">Ce mois-ci</option>
          <option value="next-month">Mois prochain</option>
        </select>
        <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Filtre appliqué aux tableaux, aux KPIs et aux échéances ci-dessous.
        </span>
      </section>

      <HeroStats metrics={metrics} />

      <Panel
        title="Paiements reçus"
        description="Encaissements clients et billets vendus."
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Client</th>
                <th>Référence</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredIn.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    Aucun encaissement sur cette période.
                  </td>
                </tr>
              ) : (
                filteredIn.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.source}</td>
                    <td>{p.clientName ?? "—"}</td>
                    <td>{p.reference ?? "—"}</td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Paiements à effectuer"
        description="Versements dus aux lieux partenaires et fournisseurs."
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bénéficiaire</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredOut.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>
                    Aucun versement sur cette période.
                  </td>
                </tr>
              ) : (
                filteredOut.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.locationId ? locationName(p.locationId) : p.payee}</td>
                    <td>{p.description}</td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Frais des employés"
        description="Salaires, primes et notes de frais."
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredPay.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    Aucun frais sur cette période.
                  </td>
                </tr>
              ) : (
                filteredPay.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.employeeName}</td>
                    <td>{p.category}</td>
                    <td>{p.description}</td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Échéances à venir"
        description="Les six prochains mouvements, toutes catégories confondues."
      >
        <div className="timeline">
          {upcoming.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Aucune échéance à venir sur cette période.
            </p>
          ) : (
            upcoming.map((evt) => (
              <article key={evt.id} className="timeline-item">
                <span>{evt.dateLabel}</span>
                <div>
                  <h3>{evt.title}</h3>
                  <p>{evt.description}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>
    </main>
  );
}
