"use client";

import { Panel } from "@/components/panel";
import { useAnnouncementEntries } from "@/lib/data/dashboard-storage";

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AnnouncementsPanel() {
  const { entries } = useAnnouncementEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Informations à diffuser"
      description="Notes partagées avec l'équipe, avec PDF optionnel en pièce jointe."
    >
      {sorted.length === 0 ? (
        <p className="news-empty">Aucune information diffusée pour le moment.</p>
      ) : (
        <ol className="news-feed">
          {sorted.map((item) => (
            <li key={item.id} className="news-item">
              <div className="news-item-meta">
                <span className="news-category announcement">Info</span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.pdf ? (
                <a
                  className="announcement-pdf"
                  href={item.pdf.dataUrl}
                  download={item.pdf.name}
                >
                  📎 {item.pdf.name} <small>({formatSize(item.pdf.size)})</small>
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
