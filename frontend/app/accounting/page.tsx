"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { useHubData } from "@/lib/hub-provider";
import type {
  PaymentInItem,
  PaymentMethod,
  PaymentOutCategory,
  PaymentOutItem,
  PaymentStatus,
  PayrollItem,
  RefundItem,
} from "@/lib/types";
import { CashflowChart, type CashflowPoint } from "./_components/cashflow-chart";

type Period = "this-month" | "next-month" | "all";
type SortDir = "asc" | "desc";

const VAT_RATE = 0.17;
const STARTING_BALANCE = 15000;

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

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function useSort<T>(rows: T[], initialKey: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey]);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggle = (key: keyof T) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggle };
}

function chevron(active: boolean, dir: SortDir) {
  if (!active) return null;
  return <span className="sort-chevron">{dir === "asc" ? "▲" : "▼"}</span>;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ReceiptCell({ url }: { url?: string }) {
  return (
    <span
      className="receipt-link"
      title={url ? "Justificatif disponible" : "Disponible avec l'API"}
      aria-disabled={!url}
    >
      📎
    </span>
  );
}

function MethodChip({ method }: { method: PaymentMethod }) {
  return <span className="method-chip">{method}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden>
        📭
      </span>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

const KpiIcon = ({ kind }: { kind: "down" | "up" | "users" | "trend" }) => {
  const paths: Record<typeof kind, string> = {
    down: "M12 5v14m0 0l-6-6m6 6l6-6",
    up: "M12 19V5m0 0l-6 6m6-6l6 6",
    users:
      "M16 11a4 4 0 10-8 0 4 4 0 008 0zm-4 6c-3.3 0-6 1.5-6 4v1h12v-1c0-2.5-2.7-4-6-4z",
    trend: "M3 17l6-6 4 4 8-8m0 0v6m0-6h-6",
  };
  return (
    <span className={`kpi-icon ${kind}`} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d={paths[kind]}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

function SalaryBar({
  gross,
  charges,
}: {
  gross: number;
  charges: number;
}) {
  const total = gross + charges;
  if (total === 0) return null;
  const grossPct = (gross / total) * 100;
  const chargesPct = 100 - grossPct;
  return (
    <div
      className="salary-bar"
      title={`Salaire ${grossPct.toFixed(0)}% / Charges ${chargesPct.toFixed(0)}%`}
    >
      <span className="salary-bar-net" style={{ width: `${grossPct}%` }} />
      <span
        className="salary-bar-charges"
        style={{ width: `${chargesPct}%` }}
      />
    </div>
  );
}

function DepositPill({ status }: { status?: PaymentOutItem["depositStatus"] }) {
  if (!status || status === "full") return null;
  if (status === "deposit") return <span className="pill deposit">Acompte</span>;
  return <span className="pill balance">Solde dû</span>;
}

function monthBefore(iso: string): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-LU", { month: "long" });
}

function trend(currentISO: string, current: number, previous: number) {
  if (previous === 0) {
    return {
      label: current === 0 ? "Stable" : "Nouveau",
      cls: "neutral" as const,
    };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    label: `${sign}${pct.toFixed(0)}% vs ${monthLabel(monthBefore(currentISO))}`,
    cls: (pct >= 0 ? "up" : "down") as "up" | "down",
  };
}

export default function AccountingPage() {
  const {
    paymentsIn,
    paymentsOut,
    payroll,
    refunds,
    eventProfitability,
    locations,
  } = useHubData();
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");

  const locationName = (id?: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  const matchesSearch = (haystack: string) => {
    if (search.trim() === "") return true;
    return haystack.toLowerCase().includes(search.toLowerCase());
  };

  const filteredIn = useMemo(
    () =>
      paymentsIn.filter(
        (p) =>
          inPeriod(p.date, period) &&
          matchesSearch(
            `${p.source} ${p.clientName ?? ""} ${p.reference ?? ""}`,
          ),
      ),
    [paymentsIn, period, search],
  );

  const filteredOut = useMemo(
    () =>
      paymentsOut.filter(
        (p) =>
          inPeriod(p.date, period) &&
          matchesSearch(
            `${p.payee} ${p.description} ${p.locationId ? locationName(p.locationId) : ""}`,
          ),
      ),
    [paymentsOut, period, search, locations],
  );

  const filteredPay = useMemo(
    () =>
      payroll.filter(
        (p) =>
          inPeriod(p.date, period) &&
          matchesSearch(`${p.employeeName} ${p.description}`),
      ),
    [payroll, period, search],
  );

  const filteredRefunds = useMemo(
    () =>
      refunds.filter(
        (r) =>
          inPeriod(r.date, period) &&
          matchesSearch(`${r.participantName} ${r.eventName} ${r.reason}`),
      ),
    [refunds, period, search],
  );

  const sortedIn = useSort<PaymentInItem>(filteredIn, "date");
  const sortedOut = useSort<PaymentOutItem>(filteredOut, "date");
  const sortedPay = useSort<PayrollItem>(filteredPay, "date");
  const sortedRefunds = useSort<RefundItem>(filteredRefunds, "date");

  const totalIn = filteredIn.reduce((s, p) => s + p.amount, 0);
  const totalOut = filteredOut.reduce((s, p) => s + p.amount, 0);
  const totalPay = filteredPay.reduce((s, p) => s + p.amount, 0);
  const totalGross = filteredPay.reduce((s, p) => s + p.grossSalary, 0);
  const totalCharges = filteredPay.reduce((s, p) => s + p.employerCharges, 0);
  const totalRefunds = filteredRefunds.reduce((s, p) => s + p.amount, 0);

  const categoryTotals = useMemo(() => {
    const map = new Map<PaymentOutCategory, number>();
    for (const p of filteredOut) {
      map.set(p.category, (map.get(p.category) ?? 0) + p.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredOut]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayISO = today.toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const toReceive = filteredIn
      .filter((p) => p.status !== "Paid")
      .reduce((s, p) => s + p.amount, 0);
    const toPay = filteredOut
      .filter((p) => p.status !== "Paid")
      .reduce((s, p) => s + p.amount, 0);
    const wages = filteredPay
      .filter((p) => p.status !== "Paid")
      .reduce((s, p) => s + p.amount, 0);
    const forecast = toReceive - toPay - wages;

    const prevMonthSum = <T extends { date: string; amount: number }>(
      date: Date,
      items: T[],
    ) => {
      const target = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      return items
        .filter((p) => {
          const d = new Date(p.date);
          return (
            d.getFullYear() === target.getFullYear() &&
            d.getMonth() === target.getMonth()
          );
        })
        .reduce((s, p) => s + p.amount, 0);
    };
    const prevIn = prevMonthSum(today, paymentsIn);
    const prevOut = prevMonthSum(today, paymentsOut);
    const prevPay = prevMonthSum(today, payroll);
    const prevForecast = prevIn - prevOut - prevPay;

    return [
      {
        label: "À recevoir",
        value: formatEUR(toReceive),
        kind: "down" as const,
        trend: trend(todayISO, totalIn, prevIn),
      },
      {
        label: "À payer",
        value: formatEUR(toPay),
        kind: "up" as const,
        trend: trend(todayISO, totalOut, prevOut),
      },
      {
        label: "Masse salariale",
        value: formatEUR(wages),
        kind: "users" as const,
        trend: trend(todayISO, totalPay, prevPay),
      },
      {
        label: "Solde prévisionnel",
        value: formatEUR(forecast),
        kind: "trend" as const,
        trend: trend(todayISO, forecast, prevForecast),
      },
    ];
  }, [
    filteredIn,
    filteredOut,
    filteredPay,
    paymentsIn,
    paymentsOut,
    payroll,
    today,
    todayISO,
    totalIn,
    totalOut,
    totalPay,
  ]);

  const upcoming = useMemo(() => {
    const incoming = filteredIn.map((p) => ({
      id: `in-${p.id}`,
      dateISO: p.date,
      title: `Encaissement — ${p.source}`,
      description: p.status,
      amount: p.amount,
      kind: "in" as const,
    }));
    const outgoing = filteredOut.map((p) => ({
      id: `out-${p.id}`,
      dateISO: p.date,
      title: `Versement — ${p.locationId ? locationName(p.locationId) : p.payee}`,
      description: p.description,
      amount: p.amount,
      kind: "out" as const,
    }));
    const wages = filteredPay.map((p) => ({
      id: `pay-${p.id}`,
      dateISO: p.date,
      title: `${p.category} — ${p.employeeName}`,
      description: p.description,
      amount: p.amount,
      kind: "payroll" as const,
    }));

    return [...incoming, ...outgoing, ...wages]
      .filter((e) => new Date(e.dateISO) >= today)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .slice(0, 6)
      .map((e) => ({
        ...e,
        dateLabel: timelineDateFmt.format(new Date(e.dateISO)),
      }));
  }, [filteredIn, filteredOut, filteredPay, today, locations]);

  const tva = useMemo(() => {
    const collected = (filteredIn.reduce((s, p) => s + p.amount, 0) * VAT_RATE) /
      (1 + VAT_RATE);
    const deductible =
      (filteredOut.reduce((s, p) => s + p.amount, 0) * VAT_RATE) /
      (1 + VAT_RATE);
    return { collected, deductible, net: collected - deductible };
  }, [filteredIn, filteredOut]);

  const cashflow = useMemo<CashflowPoint[]>(() => {
    const days: CashflowPoint[] = [];
    const start = new Date(today);
    let balance = STARTING_BALANCE;

    const allIn = paymentsIn.filter((p) => p.status !== "Paid");
    const allOut = paymentsOut.filter((p) => p.status !== "Paid");
    const allPay = payroll.filter((p) => p.status !== "Paid");

    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);

      balance += allIn
        .filter((p) => p.date === iso)
        .reduce((s, p) => s + p.amount, 0);
      balance -= allOut
        .filter((p) => p.date === iso)
        .reduce((s, p) => s + p.amount, 0);
      balance -= allPay
        .filter((p) => p.date === iso)
        .reduce((s, p) => s + p.amount, 0);

      days.push({ dateISO: iso, balance });
    }
    return days;
  }, [paymentsIn, paymentsOut, payroll, today]);

  return (
    <main className="page">
      <SectionHeader
        eyebrow="Comptabilité"
        title="Paiements, dépenses et trésorerie en un coup d'œil."
        description="Vue d'ensemble des encaissements, des versements aux partenaires, de la masse salariale et de la rentabilité, regroupés pour le comptable."
      />

      <section className="panel accounting-toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher (client, fournisseur, employé, description…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Période"
          className="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
        >
          <option value="all">Toutes les périodes</option>
          <option value="this-month">Ce mois-ci</option>
          <option value="next-month">Mois prochain</option>
        </select>
      </section>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <KpiIcon kind={metric.kind} />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <span className={`kpi-trend ${metric.trend.cls}`}>
              {metric.trend.label}
            </span>
          </article>
        ))}
      </div>

      {/* PAIEMENTS REÇUS */}
      <Panel title="">
        <div className="accounting-panel-head">
          <div>
            <h2 style={{ margin: 0 }}>
              Paiements reçus<span className="count-badge">{filteredIn.length}</span>
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>
              Encaissements clients et billets vendus.
            </p>
          </div>
          <button
            type="button"
            className="export-btn"
            onClick={() =>
              downloadCSV("paiements-recus.csv", [
                [
                  "Date",
                  "Source",
                  "Client",
                  "Référence",
                  "Méthode",
                  "Montant EUR",
                  "Statut",
                ],
                ...sortedIn.sorted.map((p) => [
                  p.date,
                  p.source,
                  p.clientName ?? "",
                  p.reference ?? "",
                  p.paymentMethod,
                  p.amount,
                  p.status,
                ]),
              ])
            }
          >
            Exporter CSV
          </button>
        </div>

        {sortedIn.sorted.length === 0 ? (
          <EmptyState message="Aucun encaissement ne correspond à ces filtres." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => sortedIn.toggle("date")}
                  >
                    Date
                    {chevron(sortedIn.sortKey === "date", sortedIn.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedIn.toggle("source")}
                  >
                    Source
                    {chevron(sortedIn.sortKey === "source", sortedIn.sortDir)}
                  </th>
                  <th>Client</th>
                  <th>Référence</th>
                  <th>Méthode</th>
                  <th
                    className="sortable"
                    onClick={() => sortedIn.toggle("amount")}
                  >
                    Montant
                    {chevron(sortedIn.sortKey === "amount", sortedIn.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedIn.toggle("status")}
                  >
                    Statut
                    {chevron(sortedIn.sortKey === "status", sortedIn.sortDir)}
                  </th>
                  <th>Justif.</th>
                </tr>
              </thead>
              <tbody>
                {sortedIn.sorted.map((p) => (
                  <tr
                    key={p.id}
                    className={p.status === "Overdue" ? "row-overdue" : ""}
                  >
                    <td>{formatDate(p.date)}</td>
                    <td>{p.source}</td>
                    <td>{p.clientName ?? "—"}</td>
                    <td>{p.reference ?? "—"}</td>
                    <td>
                      <MethodChip method={p.paymentMethod} />
                    </td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                    <td>
                      <ReceiptCell url={p.receiptUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Total ({filteredIn.length})</td>
                  <td>{formatEUR(totalIn)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* PAIEMENTS À EFFECTUER */}
      <Panel title="">
        <div className="accounting-panel-head">
          <div>
            <h2 style={{ margin: 0 }}>
              Paiements à effectuer
              <span className="count-badge">{filteredOut.length}</span>
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>
              Versements dus aux lieux partenaires et fournisseurs.
            </p>
          </div>
          <button
            type="button"
            className="export-btn"
            onClick={() =>
              downloadCSV("paiements-a-effectuer.csv", [
                [
                  "Date",
                  "Bénéficiaire",
                  "Catégorie",
                  "Description",
                  "Méthode",
                  "Montant EUR",
                  "Statut",
                ],
                ...sortedOut.sorted.map((p) => [
                  p.date,
                  p.locationId ? locationName(p.locationId) : p.payee,
                  p.category,
                  p.description,
                  p.paymentMethod,
                  p.amount,
                  p.status,
                ]),
              ])
            }
          >
            Exporter CSV
          </button>
        </div>

        {categoryTotals.length > 0 && (
          <div className="category-pills">
            {categoryTotals.map(([cat, total]) => (
              <span key={cat} className="category-pill">
                {cat} : <strong>{formatEUR(total)}</strong>
              </span>
            ))}
          </div>
        )}

        {sortedOut.sorted.length === 0 ? (
          <EmptyState message="Aucun versement ne correspond à ces filtres." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => sortedOut.toggle("date")}
                  >
                    Date
                    {chevron(sortedOut.sortKey === "date", sortedOut.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedOut.toggle("payee")}
                  >
                    Bénéficiaire
                    {chevron(sortedOut.sortKey === "payee", sortedOut.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedOut.toggle("category")}
                  >
                    Catégorie
                    {chevron(
                      sortedOut.sortKey === "category",
                      sortedOut.sortDir,
                    )}
                  </th>
                  <th>Description</th>
                  <th>Méthode</th>
                  <th
                    className="sortable"
                    onClick={() => sortedOut.toggle("amount")}
                  >
                    Montant
                    {chevron(sortedOut.sortKey === "amount", sortedOut.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedOut.toggle("status")}
                  >
                    Statut
                    {chevron(sortedOut.sortKey === "status", sortedOut.sortDir)}
                  </th>
                  <th>Justif.</th>
                </tr>
              </thead>
              <tbody>
                {sortedOut.sorted.map((p) => (
                  <tr
                    key={p.id}
                    className={p.status === "Overdue" ? "row-overdue" : ""}
                  >
                    <td>{formatDate(p.date)}</td>
                    <td>
                      {p.locationId ? locationName(p.locationId) : p.payee}{" "}
                      <DepositPill status={p.depositStatus} />
                    </td>
                    <td>{p.category}</td>
                    <td>{p.description}</td>
                    <td>
                      <MethodChip method={p.paymentMethod} />
                    </td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                    <td>
                      <ReceiptCell url={p.receiptUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Total ({filteredOut.length})</td>
                  <td>{formatEUR(totalOut)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <h3 className="subsection-title">
          Remboursements
          <span className="count-badge">{filteredRefunds.length}</span>
        </h3>
        {sortedRefunds.sorted.length === 0 ? (
          <EmptyState message="Aucun remboursement sur cette période." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => sortedRefunds.toggle("date")}
                  >
                    Date
                    {chevron(
                      sortedRefunds.sortKey === "date",
                      sortedRefunds.sortDir,
                    )}
                  </th>
                  <th>Participant</th>
                  <th>Événement</th>
                  <th>Motif</th>
                  <th
                    className="sortable"
                    onClick={() => sortedRefunds.toggle("amount")}
                  >
                    Montant
                    {chevron(
                      sortedRefunds.sortKey === "amount",
                      sortedRefunds.sortDir,
                    )}
                  </th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedRefunds.sorted.map((r) => (
                  <tr
                    key={r.id}
                    className={r.status === "Overdue" ? "row-overdue" : ""}
                  >
                    <td>{formatDate(r.date)}</td>
                    <td>{r.participantName}</td>
                    <td>{r.eventName}</td>
                    <td>{r.reason}</td>
                    <td>{formatEUR(r.amount)}</td>
                    <td>
                      <span className={pillClass(r.status)}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total ({filteredRefunds.length})</td>
                  <td>{formatEUR(totalRefunds)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* FRAIS DES EMPLOYÉS */}
      <Panel title="">
        <div className="accounting-panel-head">
          <div>
            <h2 style={{ margin: 0 }}>
              Frais des employés
              <span className="count-badge">{filteredPay.length}</span>
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>
              Salaires (avec décomposition net / charges patronales), primes et
              notes de frais.
            </p>
          </div>
          <button
            type="button"
            className="export-btn"
            onClick={() =>
              downloadCSV("frais-employes.csv", [
                [
                  "Date",
                  "Employé",
                  "Catégorie",
                  "Description",
                  "Salaire brut",
                  "Charges patronales",
                  "Coût total",
                  "Méthode",
                  "Statut",
                ],
                ...sortedPay.sorted.map((p) => [
                  p.date,
                  p.employeeName,
                  p.category,
                  p.description,
                  p.grossSalary,
                  p.employerCharges,
                  p.amount,
                  p.paymentMethod,
                  p.status,
                ]),
              ])
            }
          >
            Exporter CSV
          </button>
        </div>

        {sortedPay.sorted.length === 0 ? (
          <EmptyState message="Aucun frais ne correspond à ces filtres." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => sortedPay.toggle("date")}
                  >
                    Date
                    {chevron(sortedPay.sortKey === "date", sortedPay.sortDir)}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => sortedPay.toggle("employeeName")}
                  >
                    Employé
                    {chevron(
                      sortedPay.sortKey === "employeeName",
                      sortedPay.sortDir,
                    )}
                  </th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Brut</th>
                  <th>Charges</th>
                  <th>Répartition</th>
                  <th
                    className="sortable"
                    onClick={() => sortedPay.toggle("amount")}
                  >
                    Coût total
                    {chevron(sortedPay.sortKey === "amount", sortedPay.sortDir)}
                  </th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th>Justif.</th>
                </tr>
              </thead>
              <tbody>
                {sortedPay.sorted.map((p) => (
                  <tr
                    key={p.id}
                    className={p.status === "Overdue" ? "row-overdue" : ""}
                  >
                    <td>{formatDate(p.date)}</td>
                    <td>{p.employeeName}</td>
                    <td>{p.category}</td>
                    <td>{p.description}</td>
                    <td>{formatEUR(p.grossSalary)}</td>
                    <td>{formatEUR(p.employerCharges)}</td>
                    <td className="salary-bar-cell">
                      <SalaryBar
                        gross={p.grossSalary}
                        charges={p.employerCharges}
                      />
                    </td>
                    <td>{formatEUR(p.amount)}</td>
                    <td>
                      <MethodChip method={p.paymentMethod} />
                    </td>
                    <td>
                      <span className={pillClass(p.status)}>{p.status}</span>
                    </td>
                    <td>
                      <ReceiptCell url={p.receiptUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total ({filteredPay.length})</td>
                  <td>{formatEUR(totalGross)}</td>
                  <td>{formatEUR(totalCharges)}</td>
                  <td></td>
                  <td>{formatEUR(totalPay)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* RENTABILITÉ PAR ÉVÉNEMENT */}
      <Panel
        title="Rentabilité par événement"
        description="Marge nette par événement = recettes billets − coût lieu − fournitures − autres coûts − remboursements."
      >
        {eventProfitability.length === 0 ? (
          <EmptyState message="Aucun événement enregistré." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Date</th>
                  <th>Recettes</th>
                  <th>Coût lieu</th>
                  <th>Fournitures</th>
                  <th>Autres coûts</th>
                  <th>Remboursements</th>
                  <th>Marge nette</th>
                </tr>
              </thead>
              <tbody>
                {eventProfitability.map((e) => {
                  const margin =
                    e.ticketRevenue -
                    e.venueCost -
                    e.suppliesCost -
                    e.otherCosts -
                    e.refunds;
                  return (
                    <tr key={e.id}>
                      <td>{e.eventName}</td>
                      <td>{formatDate(e.eventDate)}</td>
                      <td>{formatEUR(e.ticketRevenue)}</td>
                      <td>{formatEUR(e.venueCost)}</td>
                      <td>{formatEUR(e.suppliesCost)}</td>
                      <td>{formatEUR(e.otherCosts)}</td>
                      <td>{formatEUR(e.refunds)}</td>
                      <td
                        className={
                          margin >= 0 ? "margin-positive" : "margin-negative"
                        }
                      >
                        {formatEUR(margin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total ({eventProfitability.length})</td>
                  <td>
                    {formatEUR(
                      eventProfitability.reduce(
                        (s, e) => s + e.ticketRevenue,
                        0,
                      ),
                    )}
                  </td>
                  <td>
                    {formatEUR(
                      eventProfitability.reduce((s, e) => s + e.venueCost, 0),
                    )}
                  </td>
                  <td>
                    {formatEUR(
                      eventProfitability.reduce(
                        (s, e) => s + e.suppliesCost,
                        0,
                      ),
                    )}
                  </td>
                  <td>
                    {formatEUR(
                      eventProfitability.reduce((s, e) => s + e.otherCosts, 0),
                    )}
                  </td>
                  <td>
                    {formatEUR(
                      eventProfitability.reduce((s, e) => s + e.refunds, 0),
                    )}
                  </td>
                  <td
                    className={
                      eventProfitability.reduce(
                        (s, e) =>
                          s +
                          e.ticketRevenue -
                          e.venueCost -
                          e.suppliesCost -
                          e.otherCosts -
                          e.refunds,
                        0,
                      ) >= 0
                        ? "margin-positive"
                        : "margin-negative"
                    }
                  >
                    {formatEUR(
                      eventProfitability.reduce(
                        (s, e) =>
                          s +
                          e.ticketRevenue -
                          e.venueCost -
                          e.suppliesCost -
                          e.otherCosts -
                          e.refunds,
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* RÉCAP TVA */}
      <Panel
        title="Récap TVA"
        description={`Calcul indicatif au taux luxembourgeois standard de ${(VAT_RATE * 100).toFixed(0)}%. Taux super-réduit 3% non détecté dans les mocks actuels.`}
      >
        <div className="tva-grid">
          <div className="tva-row">
            <div className="tva-label">
              TVA collectée
              <small>17% inclus dans les encaissements</small>
            </div>
            <strong>{formatEUR(tva.collected)}</strong>
          </div>
          <div className="tva-row">
            <div className="tva-label">
              TVA déductible
              <small>17% inclus dans les versements éligibles</small>
            </div>
            <strong>{formatEUR(tva.deductible)}</strong>
          </div>
          <div className="tva-row tva-net">
            <div className="tva-label">TVA nette à reverser</div>
            <strong>{formatEUR(tva.net)}</strong>
          </div>
        </div>
      </Panel>

      {/* PROJECTION DE TRÉSORERIE */}
      <Panel
        title="Projection de trésorerie"
        description={`Solde projeté jour par jour sur 30 jours, à partir d'un solde initial de ${formatEUR(STARTING_BALANCE)}. Vert = positif, rouge = négatif.`}
      >
        <CashflowChart points={cashflow} />
      </Panel>

      {/* TIMELINE — ÉCHÉANCES À VENIR */}
      <Panel
        title="Échéances à venir"
        description="Les six prochains mouvements, toutes catégories confondues."
      >
        <div className="timeline-legend">
          <span className="timeline-legend-item">
            <span className="timeline-legend-dot in" />
            Encaissement
          </span>
          <span className="timeline-legend-item">
            <span className="timeline-legend-dot out" />
            Décaissement
          </span>
          <span className="timeline-legend-item">
            <span className="timeline-legend-dot payroll" />
            Salaire / frais
          </span>
        </div>
        <div className="timeline">
          {upcoming.length === 0 ? (
            <EmptyState message="Aucune échéance à venir sur cette période." />
          ) : (
            upcoming.map((evt) => (
              <article key={evt.id} className="timeline-item">
                <span>{evt.dateLabel}</span>
                <div>
                  <h3>{evt.title}</h3>
                  <p>
                    <span className={`timeline-amount ${evt.kind}`}>
                      {evt.kind === "in" ? "+" : "−"}
                      {formatEUR(evt.amount)}
                    </span>{" "}
                    · {evt.description}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>
    </main>
  );
}
