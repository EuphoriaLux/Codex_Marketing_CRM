"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { navSections, type NavItem } from "@/lib/constants/navigation";

type Entry = NavItem & { section: string };

const entries: Entry[] = navSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title })),
);

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function matches(entry: Entry, query: string): boolean {
  const haystack = fold(`${entry.label} ${entry.section} ${entry.keywords ?? ""}`);
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

// Jump to any hub page from the keyboard: Ctrl+K / Cmd+K, or "/" outside a
// text field.
export function QuickSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const results = useMemo(
    () => (query.trim() ? entries.filter((e) => matches(e, query)) : entries),
    [query],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[cursor]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="topbar-search"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span aria-hidden>🔍</span>
        <span>Aller à une page…</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open ? (
        <div className="quick-search-backdrop" onClick={() => setOpen(false)}>
          <div
            className="quick-search"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche rapide"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="search"
              value={query}
              placeholder="Partenaires, WhatsApp, remboursements…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              aria-controls="quick-search-results"
              aria-activedescendant={results[cursor] ? `qs-${cursor}` : undefined}
            />
            <ul id="quick-search-results" role="listbox">
              {results.length === 0 ? (
                <li className="quick-search-empty">Aucune page ne correspond.</li>
              ) : (
                results.map((entry, index) => (
                  <li
                    key={entry.href}
                    id={`qs-${index}`}
                    role="option"
                    aria-selected={index === cursor}
                    className={index === cursor ? "is-active" : undefined}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(entry)}
                  >
                    <span aria-hidden>{entry.icon}</span>
                    <span>{entry.label}</span>
                    <small>{entry.section}</small>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
