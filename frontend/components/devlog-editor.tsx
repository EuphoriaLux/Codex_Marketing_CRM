"use client";

import { useState } from "react";
import { Panel } from "@/components/panel";
import { useDevlogEntries } from "@/lib/data/dashboard-storage";
import type { NewsCategory } from "@/lib/types";

const CATEGORIES: NewsCategory[] = ["Update", "Feature", "Meeting", "Announcement"];

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DevlogEditor() {
  const { entries, addEntry, removeEntry } = useDevlogEntries();
  const [date, setDate] = useState(todayIso);
  const [category, setCategory] = useState<NewsCategory>("Update");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    addEntry({
      date,
      category,
      title: title.trim(),
      description: description.trim(),
    });
    setTitle("");
    setDescription("");
    setDate(todayIso());
    setCategory("Update");
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Latest updates (devlog)"
      description="Ajoutez ici les changements du site, nouvelles fonctionnalités et retours de réunion."
    >
      <form className="devlog-form" onSubmit={handleSubmit}>
        <div className="devlog-form-row">
          <label className="devlog-field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label className="devlog-field">
            <span>Catégorie</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as NewsCategory)}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="devlog-field">
          <span>Titre</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nouvelle entrée du devlog"
            required
          />
        </label>
        <label className="devlog-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Détaillez la modification ou l'information à partager."
            rows={3}
            required
          />
        </label>
        <div className="devlog-form-actions">
          <button type="submit" className="button">
            Ajouter au devlog
          </button>
        </div>
      </form>

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
                <button
                  type="button"
                  className="news-remove"
                  onClick={() => removeEntry(item.id)}
                  aria-label={`Supprimer ${item.title}`}
                >
                  Supprimer
                </button>
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
