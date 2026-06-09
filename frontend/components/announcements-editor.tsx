"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/panel";
import {
  readFileAsDataUrl,
  useAnnouncementEntries,
} from "@/lib/data/dashboard-storage";

const MAX_PDF_BYTES = 2 * 1024 * 1024; // 2 MB

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AnnouncementsEditor() {
  const { entries, addEntry, removeEntry } = useAnnouncementEntries();
  const [date, setDate] = useState(todayIso);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_PDF_BYTES) {
      setError(`Le PDF dépasse la limite de ${formatSize(MAX_PDF_BYTES)}.`);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file && file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setPdfFile(file);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(todayIso());
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let pdf: { name: string; dataUrl: string; size: number } | undefined;
      if (pdfFile) {
        const dataUrl = await readFileAsDataUrl(pdfFile);
        pdf = { name: pdfFile.name, dataUrl, size: pdfFile.size };
      }
      addEntry({
        date,
        title: title.trim(),
        description: description.trim(),
        pdf,
      });
      resetForm();
    } catch {
      setError("Impossible de lire le fichier PDF.");
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Informations à diffuser"
      description="Publiez une note avec l'équipe, avec un PDF optionnel en pièce jointe."
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
            <span>PDF (optionnel, max 2 Mo)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <label className="devlog-field">
          <span>Titre</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sujet de l'information"
            required
          />
        </label>
        <label className="devlog-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contenu à diffuser à l'équipe."
            rows={3}
            required
          />
        </label>
        {error ? <p className="devlog-error">{error}</p> : null}
        <div className="devlog-form-actions">
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Envoi…" : "Diffuser l'information"}
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="news-empty">Aucune information diffusée pour le moment.</p>
      ) : (
        <ol className="news-feed">
          {sorted.map((item) => (
            <li key={item.id} className="news-item">
              <div className="news-item-meta">
                <span className="news-category announcement">Info</span>
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
