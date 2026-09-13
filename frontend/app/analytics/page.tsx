"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import {
  fetchAnalyticsOverview,
  type AnalyticsPeriod,
} from "@/lib/api/analytics";
import type {
  AnalyticsOverviewResponse,
  AnalyticsSourceStatus,
} from "@/lib/api/contracts";

const PERIODS: AnalyticsPeriod[] = [7, 28, 90];
const integerFormatter = new Intl.NumberFormat("fr-LU");
const decimalFormatter = new Intl.NumberFormat("fr-LU", {
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("fr-LU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatInteger(value: number | null): string {
  return value === null ? "Indisponible" : integerFormatter.format(value);
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${decimalFormatter.format(value * 100)} %`;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | null;
  detail: string;
}) {
  return (
    <article className="analytics-metric-card">
      <span>{label}</span>
      <strong className={value === null ? "is-unavailable" : undefined}>
        {formatInteger(value)}
      </strong>
      <small>{detail}</small>
    </article>
  );
}

function TrendChart({
  label,
  data,
  color = "#818cf8",
}: {
  label: string;
  data: Array<{ date: string; value: number }>;
  color?: string;
}) {
  if (data.length === 0) {
    return <div className="analytics-empty">Données de tendance indisponibles.</div>;
  }

  const values = data.map((point) => point.value);
  const maximum = Math.max(...values, 1);
  const width = 640;
  const height = 180;
  const padding = 14;
  const points = data
    .map((point, index) => {
      const x =
        data.length === 1
          ? width / 2
          : padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (point.value / maximum) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="analytics-trend">
      <div className="analytics-trend-meta">
        <span>{formatDate(data[0].date)}</span>
        <strong>Pic&nbsp;: {integerFormatter.format(maximum)}</strong>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}, du ${formatDate(data[0].date)} au ${formatDate(data[data.length - 1].date)}`}
      >
        <line x1="14" y1="166" x2="626" y2="166" className="analytics-axis" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function SourceState({ source }: { source: AnalyticsSourceStatus }) {
  const label =
    source.status === "ready"
      ? "Connectée"
      : source.status === "error"
        ? "Erreur temporaire"
        : "À configurer";
  return (
    <li className="analytics-source-row">
      <span className={`analytics-source-dot ${source.status}`} aria-hidden="true" />
      <div>
        <strong>{source.label}</strong>
        <p>
          {source.observedThrough
            ? `Données observées jusqu’au ${formatDate(source.observedThrough)}`
            : source.message ?? "Source indisponible"}
        </p>
      </div>
      <span className={`analytics-source-pill ${source.status}`}>{label}</span>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="analytics-loading" role="status" aria-live="polite">
      <div className="analytics-spinner" aria-hidden="true" />
      <div>
        <strong>Consolidation des sources…</strong>
        <p>Search Console, Google Analytics, Application Insights et Crush.lu.</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(28);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAnalyticsOverview(period));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger les données analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const activationMaximum = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      data.activation.current.incomplete,
      data.activation.current.pending,
      data.activation.current.verified,
      data.activation.current.rejected,
      1,
    );
  }, [data]);

  return (
    <main className="page analytics-page">
      <div className="analytics-heading-row">
        <SectionHeader
          eyebrow="Pilotage"
          title="Analytics Crush.lu"
          description="Une vue agrégée de la découverte, de l’audience, de l’usage produit et de l’activation des membres."
        />
        <div className="analytics-period" aria-label="Période d’analyse">
          {PERIODS.map((days) => (
            <button
              key={days}
              type="button"
              className={period === days ? "active" : undefined}
              aria-pressed={period === days}
              onClick={() => setPeriod(days)}
            >
              {days} j
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? (
        <div className="status-banner warning analytics-error" role="alert">
          <span>{error}</span>
          <button type="button" className="button secondary" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="analytics-context-row">
            <p>
              {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
              <span> · fuseau {data.period.timezone}</span>
            </p>
            <p>
              Actualisé le{" "}
              {new Intl.DateTimeFormat("fr-LU", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(data.generatedAt))}
            </p>
          </div>

          {error ? (
            <div className="status-banner warning analytics-error" role="alert">
              <span>Actualisation impossible : {error}. Les dernières données restent affichées.</span>
              <button type="button" className="button secondary" onClick={() => void load()}>
                Réessayer
              </button>
            </div>
          ) : null}

          <section className="analytics-kpis" aria-label="Indicateurs clés">
            <MetricCard label="Impressions Google" value={data.overview.searchImpressions} detail="Search Console" />
            <MetricCard label="Clics Google" value={data.overview.searchClicks} detail="Search Console" />
            <MetricCard label="Sessions web" value={data.overview.webSessions} detail="Google Analytics" />
            <MetricCard label="Utilisateurs connectés" value={data.overview.authenticatedUsers} detail="Application Insights" />
            <MetricCard label="Profils à vérifier" value={data.overview.pendingProfiles} detail="État Crush.lu actuel" />
            <MetricCard label="Profils vérifiés" value={data.overview.verifiedProfiles} detail="État Crush.lu actuel" />
          </section>

          <div className="analytics-two-up">
            <Panel title="Découverte sur Google" description="Évolution quotidienne des clics organiques finalisés dans Search Console.">
              <TrendChart label="Clics Google" data={data.search.daily.map((row) => ({ date: row.date, value: row.clicks }))} />
              {data.search.summary ? (
                <div className="analytics-inline-stats">
                  <span>CTR <strong>{formatPercent(data.search.summary.ctr)}</strong></span>
                  <span>Position moyenne <strong>{decimalFormatter.format(data.search.summary.position)}</strong></span>
                </div>
              ) : null}
            </Panel>

            <Panel title="Audience du site" description="Sessions quotidiennes mesurées par Google Analytics.">
              <TrendChart label="Sessions web" color="#10b981" data={data.audience.daily.map((row) => ({ date: row.date, value: row.sessions }))} />
              {data.audience.summary ? (
                <div className="analytics-inline-stats">
                  <span>Utilisateurs <strong>{integerFormatter.format(data.audience.summary.users)}</strong></span>
                  <span>Engagement <strong>{formatPercent(data.audience.summary.engagementRate)}</strong></span>
                </div>
              ) : null}
            </Panel>
          </div>

          <Panel title="Pages d’entrée" description="Comparaison par chemin normalisé. Les sources restent indépendantes : aucune attribution par personne.">
            {data.search.landingPages.length ? (
              <div className="table-wrap">
                <table className="table analytics-table">
                  <thead>
                    <tr><th>Page</th><th>Impressions</th><th>Clics</th><th>CTR</th><th>Sessions</th><th>Engagement</th></tr>
                  </thead>
                  <tbody>
                    {data.search.landingPages.slice(0, 12).map((row) => (
                      <tr key={row.path}>
                        <td><code>{row.path}</code></td>
                        <td>{formatInteger(row.impressions)}</td>
                        <td>{formatInteger(row.clicks)}</td>
                        <td>{formatPercent(row.ctr)}</td>
                        <td>{formatInteger(row.sessions)}</td>
                        <td>{formatPercent(row.engagementRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="analytics-empty">Aucune page d’entrée disponible pour cette période.</div>}
          </Panel>

          <div className="analytics-two-up">
            <Panel title="Activation des profils" description="État actuel des profils Crush.lu, séparé des données d’acquisition historiques.">
              <div className="analytics-bars">
                {[
                  ["Incomplets", data.activation.current.incomplete, "incomplete"],
                  ["En attente", data.activation.current.pending, "pending"],
                  ["Vérifiés", data.activation.current.verified, "verified"],
                  ["Refusés", data.activation.current.rejected, "rejected"],
                ].map(([label, value, tone]) => (
                  <div className="analytics-bar-row" key={String(label)}>
                    <div><span>{label}</span><strong>{integerFormatter.format(Number(value))}</strong></div>
                    <div className="analytics-bar-track" aria-hidden="true">
                      <span className={String(tone)} style={{ width: `${(Number(value) / activationMaximum) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Usage produit authentifié" description="Télémétrie agrégée des pages Crush.lu connectées.">
              {data.product.summary ? (
                <div className="analytics-product-summary">
                  <MetricCard label="Pages vues" value={data.product.summary.pageViews} detail="Application Insights" />
                  <MetricCard label="Sessions" value={data.product.summary.sessions} detail="Application Insights" />
                  <MetricCard label="Exceptions" value={data.product.summary.exceptions} detail="Signal de fiabilité" />
                </div>
              ) : <div className="analytics-empty">Application Insights n’est pas disponible.</div>}
            </Panel>
          </div>

          <div className="analytics-two-up analytics-lower-grid">
            <Panel title="Tendance hebdomadaire" description="Snapshots opérationnels : les ratios ne sont pas des cohortes individuelles.">
              {data.activation.weekly.length ? (
                <div className="table-wrap">
                  <table className="table analytics-table">
                    <thead><tr><th>Semaine</th><th>Inscriptions</th><th>Soumis</th><th>Vérifiés</th></tr></thead>
                    <tbody>
                      {data.activation.weekly.map((row) => (
                        <tr key={row.weekStart}>
                          <td>{formatDate(row.weekStart)}</td>
                          <td>{formatInteger(row.newSignups)}</td>
                          <td>{formatInteger(row.profilesSubmitted)}</td>
                          <td>{formatInteger(row.profilesVerified)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="analytics-empty">Aucun snapshot hebdomadaire sur cette période.</div>}
            </Panel>

            <Panel title="Événements produit" description="Principaux événements personnalisés remontés par Application Insights.">
              {data.product.events.length ? (
                <ol className="analytics-event-list">
                  {data.product.events.slice(0, 10).map((event) => (
                    <li key={event.name}><code>{event.name}</code><strong>{integerFormatter.format(event.count)}</strong></li>
                  ))}
                </ol>
              ) : <div className="analytics-empty">Aucun événement produit disponible.</div>}
            </Panel>
          </div>

          <Panel title="État des sources" description="Une panne d’un fournisseur ne masque pas les autres agrégats.">
            <ul className="analytics-source-list">
              {data.sources.map((source) => <SourceState key={source.id} source={source} />)}
            </ul>
            <div className="analytics-caveats">
              <strong>À garder en tête</strong>
              <ul>{data.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>
            </div>
          </Panel>
        </>
      ) : null}
    </main>
  );
}
