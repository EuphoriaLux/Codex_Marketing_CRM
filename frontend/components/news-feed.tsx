import type { NewsItem } from "@/lib/types";

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

export function NewsFeed({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="news-empty">No updates yet.</p>;
  }

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  return (
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
  );
}
