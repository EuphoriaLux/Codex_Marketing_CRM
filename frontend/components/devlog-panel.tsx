"use client";

import { Panel } from "@/components/panel";
import { useDevlogEntries } from "@/lib/data/dashboard-storage";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export function DevlogPanel() {
  const { entries } = useDevlogEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Latest updates"
      description="Changements du site, nouvelles fonctionnalités et retours de réunion."
    >
      {sorted.length === 0 ? (
        <p className="news-empty">Aucune entrée pour le moment.</p>
      ) : (
        <ol className="news-feed">
          {sorted.map((item) => (
            <li key={item.id} className="news-item">
              <div className="news-item-meta">
                <span className={`news-category ${item.category.toLowerCase()}`}>
                  {item.category}
                </span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
