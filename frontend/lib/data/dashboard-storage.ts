"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnnouncementItem, NewsItem } from "@/lib/types";

const DEVLOG_KEY = "hub_devlog_entries";
const ANNOUNCEMENTS_KEY = "hub_announcement_entries";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useDevlogEntries() {
  const [entries, setEntries] = useState<NewsItem[]>([]);

  useEffect(() => {
    setEntries(readJson<NewsItem>(DEVLOG_KEY));
  }, []);

  const addEntry = useCallback((entry: Omit<NewsItem, "id">) => {
    setEntries((prev) => {
      const next = [{ ...entry, id: makeId("devlog") }, ...prev];
      writeJson(DEVLOG_KEY, next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeJson(DEVLOG_KEY, next);
      return next;
    });
  }, []);

  return { entries, addEntry, removeEntry };
}

export function useAnnouncementEntries() {
  const [entries, setEntries] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    setEntries(readJson<AnnouncementItem>(ANNOUNCEMENTS_KEY));
  }, []);

  const addEntry = useCallback((entry: Omit<AnnouncementItem, "id">) => {
    setEntries((prev) => {
      const next = [{ ...entry, id: makeId("info") }, ...prev];
      try {
        writeJson(ANNOUNCEMENTS_KEY, next);
      } catch {
        // localStorage quota likely exceeded — keep state without persistence
      }
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeJson(ANNOUNCEMENTS_KEY, next);
      return next;
    });
  }, []);

  return { entries, addEntry, removeEntry };
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}
