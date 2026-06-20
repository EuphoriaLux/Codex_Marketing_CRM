"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  generateDrafts,
  listSocialPosts,
  updateSocialPost,
} from "@/lib/api/social";
import {
  SocialLanguage,
  SocialPillar,
  SocialPlatform,
  SocialPost,
  SocialPostStatus,
} from "@/lib/types";

// Statuses that can still change server-side (Buffer push: scheduled → published
// / failed). While any post sits in one of these, the board polls for updates.
const LIVE: SocialPostStatus[] = ["approved", "scheduled"];
const POLL_INTERVAL_MS = 5_000;

const PILLARS: { value: SocialPillar; label: string }[] = [
  { value: "event_recap", label: "Récap événement" },
  { value: "dating_tip", label: "Conseil rencontre" },
  { value: "milestone", label: "Cap utilisateurs" },
  { value: "community", label: "Communauté" },
  { value: "promo", label: "Promotion" },
];

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
];

const LANGUAGES: { value: SocialLanguage; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "de", label: "DE" },
];

const PILLAR_LABEL = Object.fromEntries(PILLARS.map((p) => [p.value, p.label]));
const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map((p) => [p.value, p.label]));

// Reuse existing .pill modifiers (they already carry dark-theme overrides in
// globals.css) so badges feel native to the hub rather than bolted on.
const STATUS_PILL: Record<SocialPostStatus, string> = {
  draft: "deposit",
  pending_review: "pending",
  approved: "scheduled",
  scheduled: "scheduled",
  published: "paid",
  failed: "overdue",
};

const STATUS_LABEL: Record<SocialPostStatus, string> = {
  draft: "Brouillon",
  pending_review: "À valider",
  approved: "Approuvé",
  scheduled: "Programmé",
  published: "Publié",
  failed: "Échec",
};

// The three board lanes, in workflow order. The last lane shows the tail of the
// pipeline (scheduled and what came out of it) so published/failed stay visible.
const LANES: { key: string; title: string; statuses: SocialPostStatus[] }[] = [
  { key: "draft", title: "Brouillons", statuses: ["draft"] },
  { key: "review", title: "À valider", statuses: ["pending_review"] },
  {
    key: "scheduled",
    title: "Programmés",
    statuses: ["approved", "scheduled", "published", "failed"],
  },
];

// Default schedule: next Friday 16:00 local — the planning slot from the routine.
function nextFriday1600(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 5=Fri
  let delta = (5 - day + 7) % 7;
  if (delta === 0 && d.getHours() >= 16) delta = 7;
  d.setDate(d.getDate() + delta);
  d.setHours(16, 0, 0, 0);
  return d.toISOString();
}

function mergeById(prev: SocialPost[], incoming: SocialPost[]): SocialPost[] {
  const map = new Map(prev.map((p) => [p.id, p]));
  for (const p of incoming) map.set(p.id, p);
  return Array.from(map.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

function StatusBadge({ status }: { status: SocialPostStatus }) {
  return <span className={`pill ${STATUS_PILL[status]}`}>{STATUS_LABEL[status]}</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.12rem 0.5rem",
        borderRadius: 999,
        border: "1px solid var(--line)",
        fontSize: "0.72rem",
        color: "var(--muted)",
      }}
    >
      {children}
    </span>
  );
}

export default function SocialPage() {
  const [hook, setHook] = useState("");
  const [pillar, setPillar] = useState<SocialPillar>("event_recap");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(["instagram", "facebook"]);
  const [languages, setLanguages] = useState<SocialLanguage[]>(["fr", "en"]);
  const [generating, setGenerating] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSocialPosts()
      .then((res) => {
        if (!cancelled) setPosts(res.items);
      })
      .catch(() => {
        if (!cancelled) setPostsError("Impossible de charger les publications.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasLive = useMemo(() => posts.some((p) => LIVE.includes(p.status)), [posts]);
  const postsRef = useRef(posts);
  postsRef.current = posts;

  const refresh = useCallback(async () => {
    try {
      const res = await listSocialPosts();
      setPosts((prev) => mergeById(prev, res.items));
    } catch {
      setPostsError("Actualisation en échec ; nouvelle tentative.");
    }
  }, []);

  useEffect(() => {
    if (!hasLive) return;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasLive, refresh]);

  function togglePlatform(value: SocialPlatform) {
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  function toggleLanguage(value: SocialLanguage) {
    setLanguages((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value],
    );
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComposeError(null);

    if (!hook.trim()) {
      setComposeError("Saisissez une accroche.");
      return;
    }
    if (platforms.length === 0) {
      setComposeError("Sélectionnez au moins une plateforme.");
      return;
    }
    if (languages.length === 0) {
      setComposeError("Sélectionnez au moins une langue.");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateDrafts({ hook: hook.trim(), pillar, platforms, languages });
      setPosts((prev) => mergeById(prev, res.posts));
      setHook("");
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : "Génération en échec.");
    } finally {
      setGenerating(false);
    }
  }

  async function patch(
    id: string,
    payload: Parameters<typeof updateSocialPost>[1],
  ) {
    setBusyId(id);
    try {
      const res = await updateSocialPost(id, payload);
      setPosts((prev) => mergeById(prev, [res.post]));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "Mise à jour en échec.");
    } finally {
      setBusyId(null);
    }
  }

  function laneItems(statuses: SocialPostStatus[]): SocialPost[] {
    return posts.filter((p) => statuses.includes(p.status));
  }

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Réseaux sociaux"
        title="Planification du feed social"
        description="Brouillons générés par IA, validés par l'équipe, puis programmés. Django rédige via l'API Claude et pousse les posts approuvés vers Buffer (Instagram, Facebook, LinkedIn)."
      />

      <Panel
        title="Nouvel atelier de contenu"
        description="Donnez une accroche et les langues : Django génère un brouillon par langue via l'API Claude. Vous éditez et validez avant programmation."
      >
        <form className="app-form" onSubmit={handleGenerate}>
          <label>
            Accroche
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Ex. Retour sur la Quiz Night de jeudi — 40 participants"
            />
          </label>

          <label>
            Pilier
            <select value={pillar} onChange={(e) => setPillar(e.target.value as SocialPillar)}>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Plateformes</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.4rem" }}>
              {PLATFORMS.map((p) => {
                const on = platforms.includes(p.value);
                return (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    className={`pill ${on ? "scheduled" : ""}`}
                    style={{
                      cursor: "pointer",
                      border: on ? "none" : "1px solid var(--line)",
                      background: on ? undefined : "transparent",
                      color: on ? undefined : "var(--muted)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Langues</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.4rem" }}>
              {LANGUAGES.map((l) => {
                const on = languages.includes(l.value);
                return (
                  <button
                    type="button"
                    key={l.value}
                    onClick={() => toggleLanguage(l.value)}
                    className={`pill ${on ? "deposit" : ""}`}
                    style={{
                      cursor: "pointer",
                      border: on ? "none" : "1px solid var(--line)",
                      background: on ? undefined : "transparent",
                      color: on ? undefined : "var(--muted)",
                    }}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button type="submit" className="button" disabled={generating}>
            {generating ? "Génération…" : "Générer les brouillons"}
          </button>

          {composeError ? <p className="form-note">{composeError}</p> : null}
        </form>
      </Panel>

      {postsError ? <p className="form-note">{postsError}</p> : null}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginTop: "1.5rem",
        }}
      >
        {LANES.map((lane) => {
          const items = laneItems(lane.statuses);
          return (
            <Panel key={lane.key} title={`${lane.title} (${items.length})`}>
              {items.length === 0 ? (
                <p className="form-note">Aucune publication.</p>
              ) : (
                <div className="stack-list" style={{ display: "grid", gap: "0.75rem", paddingLeft: 0 }}>
                  {items.map((post) => {
                    const draftValue = drafts[post.id] ?? post.content;
                    const dirty = draftValue !== post.content;
                    const busy = busyId === post.id;
                    return (
                      <div key={post.id} className="item-card">
                        <div className="item-row">
                          <strong style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                            {PILLAR_LABEL[post.pillar]} · {post.language.toUpperCase()}
                          </strong>
                          <StatusBadge status={post.status} />
                        </div>

                        <textarea
                          value={draftValue}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          disabled={busy || post.status === "published"}
                          rows={4}
                          style={{
                            width: "100%",
                            marginTop: "0.5rem",
                            resize: "vertical",
                            font: "inherit",
                          }}
                        />

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                          {post.platforms.map((pf) => (
                            <Chip key={pf}>{PLATFORM_LABEL[pf]}</Chip>
                          ))}
                          {post.scheduled_for ? (
                            <Chip>📅 {new Date(post.scheduled_for).toLocaleString()}</Chip>
                          ) : null}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.6rem" }}>
                          {dirty && post.status !== "published" ? (
                            <button
                              type="button"
                              className="button secondary"
                              disabled={busy}
                              onClick={() => patch(post.id, { content: draftValue })}
                            >
                              Enregistrer
                            </button>
                          ) : null}

                          {post.status === "draft" ? (
                            <button
                              type="button"
                              className="button"
                              disabled={busy}
                              onClick={() =>
                                patch(post.id, {
                                  content: draftValue,
                                  status: "pending_review",
                                })
                              }
                            >
                              Envoyer en validation
                            </button>
                          ) : null}

                          {post.status === "pending_review" ? (
                            <>
                              <button
                                type="button"
                                className="button"
                                disabled={busy}
                                onClick={() =>
                                  patch(post.id, {
                                    content: draftValue,
                                    status: "scheduled",
                                    scheduled_for: nextFriday1600(),
                                  })
                                }
                              >
                                Approuver et programmer
                              </button>
                              <button
                                type="button"
                                className="button secondary"
                                disabled={busy}
                                onClick={() => patch(post.id, { status: "draft" })}
                              >
                                Renvoyer en brouillon
                              </button>
                            </>
                          ) : null}

                          {post.status === "failed" ? (
                            <button
                              type="button"
                              className="button secondary"
                              disabled={busy}
                              onClick={() =>
                                patch(post.id, {
                                  status: "scheduled",
                                  scheduled_for: nextFriday1600(),
                                })
                              }
                            >
                              Reprogrammer
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </main>
  );
}
