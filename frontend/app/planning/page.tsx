"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { fetchEventAvailabilities, fetchHubEvents } from "@/lib/api/events";
import type { EventCoachAvailability, HubEvent } from "@/lib/types";

// Les jours sont calculés en heure de Luxembourg, comme les fiches événement.
const TIME_ZONE = "Europe/Luxembourg";
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const dayLabelFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
});
const weekLabelFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
});
const fullDateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "YYYY-MM-DD" du jour à Luxembourg. */
function luxDayKey(date: Date): string {
  return dayKeyFmt.format(date);
}

function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

function addDays(key: string, days: number): string {
  const date = keyToDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(key: string): string {
  const weekday = (keyToDate(key).getUTCDay() + 6) % 7;
  return addDays(key, -weekday);
}

type PlannedEvent = HubEvent & {
  assigned: EventCoachAvailability[];
  volunteers: number;
};

const shiftStyle: Record<"covered" | "missing", React.CSSProperties> = {
  covered: {
    background: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.35)",
  },
  missing: {
    background: "rgba(244,63,94,0.15)",
    borderColor: "rgba(244,63,94,0.4)",
  },
};

function volunteerLabel(count: number): string {
  return `${count} volontaire${count > 1 ? "s" : ""}`;
}

export default function PlanningPage() {
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [availabilities, setAvailabilities] = useState<EventCoachAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayKey = luxDayKey(new Date());
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayKey));

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchHubEvents(), fetchEventAvailabilities()])
      .then(([eventItems, availabilityItems]) => {
        if (!mounted) return;
        setEvents(eventItems);
        setAvailabilities(availabilityItems);
      })
      .catch(() => {
        if (mounted) setError("Impossible de charger les événements et les coachs.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const planned = useMemo<PlannedEvent[]>(
    () =>
      events
        .filter((event) => !event.isDemo)
        .map((event) => {
          const forEvent = availabilities.filter((a) => a.eventId === event.id);
          return {
            ...event,
            assigned: forEvent.filter((a) => a.status === "assigned"),
            volunteers: forEvent.filter((a) => a.status === "available").length,
          };
        })
        .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime)),
    [events, availabilities],
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const key = addDays(weekStart, index);
        return {
          key,
          label: dayLabelFmt.format(keyToDate(key)),
          today: key === todayKey,
          events: planned.filter((event) => luxDayKey(new Date(event.dateTime)) === key),
        };
      }),
    [planned, weekStart, todayKey],
  );

  const openSlots = planned.filter(
    (event) =>
      luxDayKey(new Date(event.dateTime)) >= todayKey &&
      event.assigned.length < event.coachesNeeded,
  );

  const weekEnd = addDays(weekStart, 6);
  const weekTitle = `Semaine du ${weekLabelFmt.format(keyToDate(weekStart))} au ${weekLabelFmt.format(keyToDate(weekEnd))}`;

  return (
    <main className="page">
      <SectionHeader
        eyebrow="🗓️ Planning équipe"
        title="Planning de la semaine."
        description="Les événements Crush.lu de la semaine et les coachs qui y sont assignés. Les disponibilités se déclarent dans Événements & Coachs."
      />

      {error ? (
        <div className="panel" style={{ color: "var(--danger)", padding: "1rem" }}>
          ⚠️ {error}
        </div>
      ) : null}

      <Panel
        title={weekTitle}
        description={loading ? "Chargement des événements…" : "Vert : équipe complète · Rouge : coachs manquants."}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <button type="button" className="button secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Semaine précédente
          </button>
          <button type="button" className="button secondary" onClick={() => setWeekStart(mondayOf(todayKey))}>
            Cette semaine
          </button>
          <button type="button" className="button secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Semaine suivante →
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(110px, 1fr))",
            gap: "0.5rem",
            marginTop: "0.4rem",
            overflowX: "auto",
          }}
        >
          {days.map((day) => (
            <div
              key={day.key}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0.6rem 0.5rem",
                minHeight: 140,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: day.today ? "#818cf8" : "var(--muted)",
                  marginBottom: "0.4rem",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  textTransform: "capitalize",
                }}
              >
                {day.label}
                {day.today ? " · Aujourd'hui" : ""}
              </div>
              {day.events.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: "0.72rem", textAlign: "center", marginTop: "0.5rem" }}>
                  —
                </div>
              ) : null}
              {day.events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "0.4rem 0.55rem",
                    border: "1px solid",
                    borderRadius: 8,
                    fontSize: "0.74rem",
                    marginTop: "0.35rem",
                    ...shiftStyle[event.assigned.length >= event.coachesNeeded ? "covered" : "missing"],
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.78rem" }}>
                    {timeFmt.format(new Date(event.dateTime))} · {event.title}
                  </strong>
                  {event.location ? (
                    <span style={{ display: "block", color: "var(--muted)", fontSize: "0.7rem" }}>
                      {event.location}
                    </span>
                  ) : null}
                  <span style={{ display: "block", fontSize: "0.7rem", marginTop: "0.2rem" }}>
                    {event.assigned.length > 0
                      ? event.assigned.map((a) => a.coachName).join(", ")
                      : "Aucun coach assigné"}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>
                    {event.assigned.length}/{event.coachesNeeded} coachs
                    {event.volunteers > 0 ? ` · ${volunteerLabel(event.volunteers)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Postes à pourvoir"
        description="Événements à venir où il manque encore des coachs assignés."
      >
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Chargement…</p>
        ) : openSlots.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Tous les événements à venir ont leur équipe complète.</p>
        ) : (
          <div className="item-list">
            {openSlots.map((event) => (
              <article key={event.id} className="item-card">
                <div className="item-row">
                  <h3>{event.title}</h3>
                  <span className="pill pending">
                    {event.assigned.length}/{event.coachesNeeded} coachs
                  </span>
                </div>
                <p>
                  {fullDateFmt.format(new Date(event.dateTime))}
                  {event.location ? ` · ${event.location}` : ""}
                  {event.volunteers > 0 ? ` · ${volunteerLabel(event.volunteers)} à valider` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
        <Link href="/events/coaches" className="button" style={{ marginTop: "0.8rem", display: "inline-block" }}>
          Gérer les disponibilités
        </Link>
      </Panel>
    </main>
  );
}
