import { Metric } from "@/lib/types";

export function HeroStats({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="stats-grid">
      {metrics.map((metric) => (
        <article key={metric.label} className="metric-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </div>
  );
}
