"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/panel";
import {
  fetchCancelledEvents,
  fetchEventAvailabilities,
  fetchHubEvents,
} from "@/lib/api/events";
import { listSocialPosts } from "@/lib/api/social";
import { listWhatsAppInbox } from "@/lib/api/whatsapp";
import type { EventCoachAvailability, HubEvent } from "@/lib/types";

// "Aujourd'hui" cockpit: one glance at what needs a staff member right now.
// Each source loads on its own, so one failing endpoint only blanks its tile.

const UPCOMING_WINDOW_DAYS = 14;
const MAX_UPCOMING = 5;

type Loadable<T> = { state: "loading" } | { state: "ready"; value: T } | { state: "error" };

type StaffedEvent = HubEvent & { assigned: number; available: number };

type CockpitData = {
  events: Loadable<StaffedEvent[]>;
  whatsappUnread: Loadable<number>;
  postsToReview: Loadable<number>;
  postsFailed: Loadable<number>;
  openRefunds: Loadable<{ events: number; cents: number }>;
};

const initial: CockpitData = {
  events: { state: "loading" },
  whatsappUnread: { state: "loading" },
  postsToReview: { state: "loading" },
  postsFailed: { state: "loading" },
  openRefunds: { state: "loading" },
};

const TZ = "Europe/Luxembourg";
const dayFormatter = new Intl.DateTimeFormat("fr-LU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
const timeFormatter = new Intl.DateTimeFormat("fr-LU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});
const euroFormatter = new Intl.NumberFormat("fr-LU", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function settle<T>(promise: Promise<T>): Promise<Loadable<T>> {
  return promise.then(
    (value) => ({ state: "ready", value }) as const,
    () => ({ state: "error" }) as const,
  );
}

function relativeDay(iso: string, now: Date): string {
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const target = new Date(iso);
  const diff = Math.round(
    (Date.parse(key(target)) - Date.parse(key(now))) / 86_400_000,
  );
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `Dans ${diff} jours`;
}

function staffEvents(
  events: HubEvent[],
  availabilities: EventCoachAvailability[],
  now: Date,
): StaffedEvent[] {
  const horizon = now.getTime() + UPCOMING_WINDOW_DAYS * 86_400_000;
  return events
    .filter((event) => {
      const start = Date.parse(event.dateTime);
      return start >= now.getTime() - 3 * 3_600_000 && start <= horizon;
    })
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime))
    .slice(0, MAX_UPCOMING)
    .map((event) => {
      const mine = availabilities.filter((a) => a.eventId === event.id);
      return {
        ...event,
        assigned: mine.filter((a) => a.status === "assigned").length,
        available: mine.filter((a) => a.status === "available").length,
      };
    });
}

function Tile({
  href,
  label,
  value,
  detail,
  tone,
}: {
  href: string;
  label: string;
  value: Loadable<string>;
  detail?: string;
  tone?: "alert" | "ok";
}) {
  const shown =
    value.state === "ready" ? value.value : value.state === "loading" ? "…" : "—";
  return (
    <Link href={href} className={`cockpit-tile${tone ? ` is-${tone}` : ""}`}>
      <span className="cockpit-tile-label">{label}</span>
      <strong>{shown}</strong>
      <small>{value.state === "error" ? "Source indisponible" : detail}</small>
    </Link>
  );
}

function map<T, U>(value: Loadable<T>, fn: (v: T) => U): Loadable<U> {
  return value.state === "ready" ? { state: "ready", value: fn(value.value) } : value;
}

export function TodayCockpit() {
  const [data, setData] = useState<CockpitData>(initial);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    const current = new Date();
    setNow(current);
    setData(initial);
    const [events, availabilities, inbox, review, failed, cancelled] = await Promise.all([
      settle(fetchHubEvents()),
      settle(fetchEventAvailabilities()),
      settle(listWhatsAppInbox(undefined, true)),
      settle(listSocialPosts("pending_review")),
      settle(listSocialPosts("failed")),
      settle(fetchCancelledEvents()),
    ]);

    setData({
      events: map(events, (items) =>
        staffEvents(
          items,
          availabilities.state === "ready" ? availabilities.value : [],
          current,
        ),
      ),
      whatsappUnread: map(inbox, (res) => res.unread_count ?? 0),
      postsToReview: map(review, (res) => res.items.length),
      postsFailed: map(failed, (res) => res.items.length),
      openRefunds: map(cancelled, (items) => {
        const open = items.filter((e) => e.openCashRefundTotalCents > 0);
        return {
          events: open.length,
          cents: open.reduce((sum, e) => sum + e.openCashRefundTotalCents, 0),
        };
      }),
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const events = data.events.state === "ready" ? data.events.value : [];
  const next = events[0];
  const understaffed = events.filter((e) => e.assigned < e.coachesNeeded).length;
  const unread = data.whatsappUnread.state === "ready" ? data.whatsappUnread.value : 0;
  const toReview = data.postsToReview.state === "ready" ? data.postsToReview.value : 0;
  const failed = data.postsFailed.state === "ready" ? data.postsFailed.value : 0;
  const refunds =
    data.openRefunds.state === "ready" ? data.openRefunds.value : { events: 0, cents: 0 };

  return (
    <>
      <section className="cockpit-tiles" aria-label="À traiter">
        <Tile
          href="/events/coaches"
          label="Prochain événement"
          value={map(data.events, (items) =>
            items[0] ? relativeDay(items[0].dateTime, now) : "Aucun",
          )}
          detail={
            next
              ? `${next.title} · ${timeFormatter.format(new Date(next.dateTime))}`
              : `Rien de prévu sur ${UPCOMING_WINDOW_DAYS} jours`
          }
          tone={understaffed > 0 ? "alert" : undefined}
        />
        <Tile
          href="/whatsapp"
          label="WhatsApp non lus"
          value={map(data.whatsappUnread, String)}
          detail={unread > 0 ? "Messages en attente de réponse" : "Boîte de réception à jour"}
          tone={unread > 0 ? "alert" : "ok"}
        />
        <Tile
          href="/marketing/social"
          label="Posts à valider"
          value={map(data.postsToReview, String)}
          detail={
            failed > 0
              ? `${failed} publication${failed > 1 ? "s" : ""} en échec`
              : toReview > 0
                ? "En attente de relecture"
                : "Rien à relire"
          }
          tone={toReview > 0 || failed > 0 ? "alert" : "ok"}
        />
        <Tile
          href="/events/cancellations"
          label="Remboursements ouverts"
          value={map(data.openRefunds, (r) => euroFormatter.format(r.cents / 100))}
          detail={
            refunds.events > 0
              ? `${refunds.events} événement${refunds.events > 1 ? "s" : ""} annulé${refunds.events > 1 ? "s" : ""}`
              : "Aucun remboursement en attente"
          }
          tone={refunds.cents > 0 ? "alert" : "ok"}
        />
      </section>

      <Panel
        title="Événements à venir"
        description={`Les ${UPCOMING_WINDOW_DAYS} prochains jours et la couverture coachs de chaque soirée.`}
      >
        {data.events.state === "loading" ? (
          <p className="cockpit-empty">Chargement des événements…</p>
        ) : data.events.state === "error" ? (
          <p className="cockpit-empty">
            Impossible de charger les événements.{" "}
            <button type="button" className="link-button" onClick={() => void load()}>
              Réessayer
            </button>
          </p>
        ) : events.length === 0 ? (
          <p className="cockpit-empty">
            Aucun événement publié sur les {UPCOMING_WINDOW_DAYS} prochains jours.
          </p>
        ) : (
          <ul className="cockpit-events">
            {events.map((event) => {
              const missing = Math.max(0, event.coachesNeeded - event.assigned);
              const start = new Date(event.dateTime);
              return (
                <li key={event.id}>
                  <div className="cockpit-event-date">
                    <strong>{relativeDay(event.dateTime, now)}</strong>
                    <span>
                      {dayFormatter.format(start)} · {timeFormatter.format(start)}
                    </span>
                  </div>
                  <div className="cockpit-event-main">
                    <strong>{event.title}</strong>
                    <span>{event.location || event.eventType}</span>
                  </div>
                  <div className="cockpit-event-staff">
                    <span className={`pill ${missing > 0 ? "overdue" : "paid"}`}>
                      {event.assigned}/{event.coachesNeeded} coachs
                    </span>
                    {missing > 0 ? (
                      <small>
                        {event.available > 0
                          ? `${event.available} dispo à assigner`
                          : `Il manque ${missing} coach${missing > 1 ? "s" : ""}`}
                      </small>
                    ) : null}
                  </div>
                  <Link href="/events/coaches" className="button secondary cockpit-event-link">
                    Gérer
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
