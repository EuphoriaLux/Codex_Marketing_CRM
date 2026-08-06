"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  createEventFacebookDrafts,
  expandPostToArticle,
  generateDrafts,
  listBufferProfiles,
  listFeaturedProfiles,
  listSocialPosts,
  listUpcomingEvents,
  updateSocialPost,
} from "@/lib/api/social";
import {
  BufferProfile,
  SocialEventSuggestion,
  SocialLanguage,
  SocialPillar,
  SocialPlatform,
  SocialPost,
  SocialPostStatus,
} from "@/lib/types";

const LIVE: SocialPostStatus[] = ["approved", "scheduled"];
const POLL_INTERVAL_MS = 5_000;

const PILLARS: { value: SocialPillar; label: string; icon: string }[] = [
  { value: "event_recap", label: "Récap événement", icon: "🍷" },
  { value: "dating_tip", label: "Conseil rencontre", icon: "💡" },
  { value: "milestone", label: "Cap utilisateurs", icon: "🎉" },
  { value: "community", label: "Communauté", icon: "👥" },
  { value: "promo", label: "Promotion", icon: "🔥" },
];

const PLATFORMS: { value: SocialPlatform; label: string; icon: string }[] = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
];

const LANGUAGES: { value: SocialLanguage; label: string; flag: string }[] = [
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

const PILLAR_LABEL = Object.fromEntries(PILLARS.map((p) => [p.value, p.label]));

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
  scheduled: "Programmé dans Buffer",
  published: "Publié sur les réseaux",
  failed: "Échec de publication",
};

const LANES: { key: string; title: string; statuses: SocialPostStatus[] }[] = [
  { key: "draft", title: "Brouillons", statuses: ["draft"] },
  { key: "review", title: "À valider par l'équipe", statuses: ["pending_review"] },
  {
    key: "scheduled",
    title: "Planning & Envois Buffer",
    statuses: ["approved", "scheduled", "published", "failed"],
  },
];

function nextFriday1600(): string {
  const d = new Date();
  const day = d.getDay();
  let delta = (5 - day + 7) % 7;
  if (delta === 0 && d.getHours() >= 16) delta = 7;
  d.setDate(d.getDate() + delta);
  d.setHours(16, 0, 0, 0);
  return d.toISOString();
}

function getWeekDays(referenceDate: Date = new Date()): { date: Date; label: string; dateStr: string }[] {
  const curr = new Date(referenceDate);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const days = [];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.setDate(first + i));
    days.push({
      date: day,
      label: `${dayNames[i]} ${day.getDate()}/${day.getMonth() + 1}`,
      dateStr: day.toISOString().split("T")[0],
    });
  }
  return days;
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

export default function MarketingSocialPage() {
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar">("kanban");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);
  const [bufferError, setBufferError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Generator Drawer state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [genCategory, setGenCategory] = useState<"kpis" | "profiles" | "tips" | "recaps">("tips");
  const [genHook, setGenHook] = useState("Créer une première conversation naturelle");
  const [genPillar, setGenPillar] = useState<SocialPillar>("dating_tip");
  const [genPlatforms, setGenPlatforms] = useState<SocialPlatform[]>(["instagram", "facebook"]);
  const [genLangs, setGenLangs] = useState<SocialLanguage[]>(["fr", "en"]);

  // Editing state
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [expandingArticle, setExpandingArticle] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await listSocialPosts();
      setPosts((prev) => mergeById(prev, res.items));
      setNotice(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement du planning";
      setNotice({ kind: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  // Category specific state
  const [upcomingEvents, setUpcomingEvents] = useState<SocialEventSuggestion[]>([]);
  const [promotionLanguages, setPromotionLanguages] = useState<Record<string, SocialLanguage>>({});
  const [promotingEventId, setPromotingEventId] = useState<string | null>(null);
  const [featuredProfiles, setFeaturedProfiles] = useState<{ id: string; first_name: string; age: string; region: string; passions: string[]; bio_quote: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const fetchUpcomingEvents = useCallback(async () => {
    try {
      const res = await listUpcomingEvents();
      setUpcomingEvents(res.items);
      setPromotionLanguages((current) => {
        const next = { ...current };
        for (const event of res.items) {
          if (!next[event.id]) {
            next[event.id] = event.available_languages.includes("fr")
              ? "fr"
              : event.available_languages[0] || "fr";
          }
        }
        return next;
      });
    } catch {
      // The planner remains usable even when event suggestions are unavailable.
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    listBufferProfiles()
      .then((res) => {
        setBufferProfiles(res.items);
        setBufferError(null);
      })
      .catch((err) => {
        setBufferProfiles([]);
        setBufferError(err instanceof Error ? err.message : "Buffer n'est pas configuré");
      });

    fetchUpcomingEvents();

    listFeaturedProfiles()
      .then((res) => {
        setFeaturedProfiles(res.items);
        if (res.items.length > 0) setSelectedProfileId(res.items[0].id);
      })
      .catch(() => {});
  }, [fetchFeed, fetchUpcomingEvents]);

  // Poll when posts sit in live Buffer states
  const hasLive = useMemo(() => posts.some((p) => LIVE.includes(p.status)), [posts]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasLive) return;
    timerRef.current = setInterval(fetchFeed, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasLive, fetchFeed]);

  // Handle batch generation trigger
  async function handleGenerateBatch(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await generateDrafts({
        category: genCategory,
        hook: genHook,
        pillar: genPillar,
        platforms: genPlatforms,
        languages: genLangs,
        profile_id: genCategory === "profiles" ? selectedProfileId : undefined,
      });
      setPosts((prev) => mergeById(prev, res.posts));
      setNotice({
        kind: "success",
        text: res.warnings?.length
          ? `${res.posts.length} publication(s) générée(s). ${res.warnings[0]}`
          : `${res.posts.length} publication(s) générée(s) par l'IA et ajoutée(s) aux brouillons !`,
      });
      setGeneratorOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de génération par l'IA";
      setNotice({ kind: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateEventDraft(event: SocialEventSuggestion) {
    setPromotingEventId(event.id);
    setNotice(null);
    try {
      const language = promotionLanguages[event.id] || "fr";
      const res = await createEventFacebookDrafts(event.id, [language]);
      setPosts((prev) => mergeById(prev, res.posts));
      await fetchUpcomingEvents();
      setNotice({
        kind: "success",
        text: res.created_count
          ? "Brouillon Facebook créé uniquement à partir du texte de l’événement (sans IA)."
          : "Le brouillon Facebook existant a été retrouvé — aucun doublon créé.",
      });
      if (res.posts[0]) openEditModal(res.posts[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible de préparer le brouillon Facebook";
      setNotice({ kind: "error", text: msg });
    } finally {
      setPromotingEventId(null);
    }
  }

  function openEditModal(post: SocialPost) {
    setEditingPost(post);
    setEditContent(post.content);
    setEditMediaUrl(post.media_url || "");
    const dateVal = post.scheduled_for
      ? new Date(post.scheduled_for).toISOString().slice(0, 16)
      : new Date(nextFriday1600()).toISOString().slice(0, 16);
    setEditSchedule(dateVal);
    const activeProfileIds = new Set(
      bufferProfiles
        .filter(
          (profile) =>
            !profile.is_queue_paused && post.platforms.includes(profile.service),
        )
        .map((profile) => profile.id),
    );
    setSelectedProfiles(
      (post.buffer_profile_ids || Array.from(activeProfileIds)).filter((id) => activeProfileIds.has(id)),
    );
  }

  async function handleSaveAndSchedule(targetStatus: SocialPostStatus) {
    if (!editingPost) return;
    if (targetStatus === "scheduled" && selectedProfiles.length === 0) {
      setNotice({ kind: "error", text: "Sélectionnez au moins un compte Buffer avant de programmer." });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const isoDate = editSchedule ? new Date(editSchedule).toISOString() : null;
      const res = await updateSocialPost(editingPost.id, {
        content: editContent,
        media_url: editMediaUrl || null,
        status: targetStatus,
        scheduled_for: isoDate,
        buffer_profile_ids: selectedProfiles,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? res.post : p)),
      );
      if (editingPost.source_event_id) await fetchUpcomingEvents();
      setNotice({
        kind: "success",
        text:
          targetStatus === "scheduled"
            ? "Publication validée et programmée dans Buffer !"
            : "Statut de la publication mis à jour.",
      });
      setEditingPost(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour";
      await fetchFeed();
      setNotice({ kind: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpandToArticle() {
    if (!editingPost) return;
    setExpandingArticle(true);
    try {
      const res = await expandPostToArticle(editingPost.id);
      setNotice({
        kind: "success",
        text: `Article d'actualité créé avec succès : "${res.title}". Disponible dans Publications.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec d'expansion en article";
      setNotice({ kind: "error", text: msg });
    } finally {
      setExpandingArticle(false);
    }
  }

  const weekDays = useMemo(() => getWeekDays(), []);
  const eventsToPromote = useMemo(
    () => upcomingEvents.filter((event) => !event.is_promoted),
    [upcomingEvents],
  );
  const editingBufferProfiles = useMemo(
    () => editingPost
      ? bufferProfiles.filter((profile) => editingPost.platforms.includes(profile.service))
      : [],
    [bufferProfiles, editingPost],
  );

  return (
    <main className="page">
      <SectionHeader
        eyebrow="📢 Section Marketing • hub.crush.lu"
        title="Planification des Réseaux Sociaux"
        description="Repérez les événements non promus, reprenez leur contenu sans IA, puis validez leur programmation Facebook via Buffer."
      />

      {notice && (
        <div className={`status-banner ${notice.kind === "error" ? "warning" : "success"}`} style={{ marginBottom: "1rem" }}>
          {notice.text}
        </div>
      )}

      <Panel
        title={`Événements à promouvoir (${eventsToPromote.length})`}
        description="Les événements publics restent ici jusqu’à leur programmation dans Buffer. Le texte vient exclusivement de la fiche Crush.lu."
      >
        {eventsToPromote.length === 0 ? (
          <p style={{ color: "#94a3b8", margin: 0 }}>
            ✅ Tous les événements publics à venir ont déjà été programmés dans Buffer.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem" }}>
            {eventsToPromote.map((event) => {
              const statusLabel = event.promotion_status === "not_started"
                ? "Jamais promu"
                : STATUS_LABEL[event.promotion_status];
              const hasStoredCopy = event.available_languages.length > 0;
              return (
                <div
                  key={event.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "start" }}>
                    <div>
                      <a href={event.event_url} target="_blank" rel="noreferrer" style={{ color: "#f8fafc", fontWeight: 650 }}>
                        {event.title}
                      </a>
                      <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "0.35rem" }}>
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} · {event.location}
                      </div>
                    </div>
                    <span className={`pill ${event.promotion_status === "failed" ? "overdue" : "pending"}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.9rem", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="input"
                      aria-label={`Langue pour ${event.title}`}
                      value={promotionLanguages[event.id] || "fr"}
                      onChange={(e) => setPromotionLanguages((current) => ({
                        ...current,
                        [event.id]: e.target.value as SocialLanguage,
                      }))}
                      style={{ minWidth: "115px" }}
                      disabled={!hasStoredCopy}
                    >
                      {event.available_languages.map((language) => (
                        <option key={language} value={language}>
                          {LANGUAGES.find((item) => item.value === language)?.flag} {language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleCreateEventDraft(event)}
                      disabled={promotingEventId === event.id || !hasStoredCopy}
                    >
                      {!hasStoredCopy
                        ? "Traduction manquante"
                        : promotingEventId === event.id
                          ? "Préparation..."
                          : event.promotion_post_id
                            ? "Ouvrir le brouillon Facebook"
                            : "📘 Créer le brouillon Facebook"}
                    </button>
                    <span style={{ color: hasStoredCopy ? "#22c55e" : "#f59e0b", fontSize: "0.75rem" }}>
                      {hasStoredCopy ? "Sans IA" : "Ajoutez d’abord une traduction à l’événement"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Control Bar & Navigation Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1.5rem 0", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.05)", padding: "0.25rem", borderRadius: "8px" }}>
          <button
            type="button"
            className={`button ${activeTab === "kanban" ? "button-primary" : "button-secondary"}`}
            onClick={() => setActiveTab("kanban")}
            style={{ fontSize: "0.9rem" }}
          >
            📋 Kanban de Validation
          </button>
          <button
            type="button"
            className={`button ${activeTab === "calendar" ? "button-primary" : "button-secondary"}`}
            onClick={() => setActiveTab("calendar")}
            style={{ fontSize: "0.9rem" }}
          >
            🗓️ Calendrier Hebdomadaire
          </button>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setGeneratorOpen(true)}
          style={{ background: "linear-gradient(135deg, #e11d48, #9333ea)", border: "none", color: "#fff" }}
        >
          ✨ Générer un lot hebdomadaire (IA)
        </button>
      </div>

      {/* Generator Modal / Drawer */}
      {generatorOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="modal-content" style={{ background: "#1e1e2d", padding: "1.75rem", borderRadius: "12px", maxWidth: "600px", width: "100%", color: "#fff" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ✨ Générateur Hebdomadaire par IA (Claude)
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Ce générateur reste réservé aux contenus éditoriaux. Les événements utilisent le flux sans IA affiché sur la page principale.
            </p>

            <form onSubmit={handleGenerateBatch} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                  Catégorie de publication
                </label>
                <select
                  className="input"
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value as any)}
                  style={{ width: "100%" }}
                >
                  <option value="kpis">📊 Catégorie 2 : Statistiques & KPIs (Nouveaux Inscrits, Matchs)</option>
                  <option value="profiles">👤 Catégorie 3 : Profil Anonymisé (Membre de la semaine)</option>
                  <option value="tips">💡 Catégorie 4 : Conseils Rencontre (Dating Tips)</option>
                  <option value="recaps">✨ Catégorie 5 : Récaps & Avis Événements passés</option>
                </select>
              </div>

              {genCategory === "profiles" && featuredProfiles.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                    Membre anonymisé à mettre en avant
                  </label>
                  <select
                    className="input"
                    value={selectedProfileId}
                    onChange={(e) => {
                      setSelectedProfileId(e.target.value);
                      const prof = featuredProfiles.find((item) => item.id === e.target.value);
                      if (prof) setGenHook(`Membre de la semaine: ${prof.first_name}, ${prof.age} ans`);
                    }}
                    style={{ width: "100%" }}
                  >
                    {featuredProfiles.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.first_name}, {prof.age} ans ({prof.region}) - {prof.passions.join(", ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                  Accroche / Thème de la semaine
                </label>
                <input
                  type="text"
                  className="input"
                  value={genHook}
                  onChange={(e) => setGenHook(e.target.value)}
                  placeholder="ex: Speed dating œnologique au Casino 2000"
                  required
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                  Pilier de contenu
                </label>
                <select
                  className="input"
                  value={genPillar}
                  onChange={(e) => setGenPillar(e.target.value as SocialPillar)}
                  style={{ width: "100%" }}
                >
                  {PILLARS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                  Réseaux cibles
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {PLATFORMS.map((p) => (
                    <label key={p.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={genPlatforms.includes(p.value)}
                        onChange={(e) => {
                          if (e.target.checked) setGenPlatforms([...genPlatforms, p.value]);
                          else setGenPlatforms(genPlatforms.filter((item) => item !== p.value));
                        }}
                      />
                      {p.icon} {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#cbd5e1" }}>
                  Langues souhaitées
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {LANGUAGES.map((l) => (
                    <label key={l.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={genLangs.includes(l.value)}
                        onChange={(e) => {
                          if (e.target.checked) setGenLangs([...genLangs, l.value]);
                          else setGenLangs(genLangs.filter((item) => item !== l.value));
                        }}
                      />
                      {l.flag} {l.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setGeneratorOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? "Génération en cours..." : "Lancer la génération"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Editor Modal */}
      {editingPost && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="modal-content" style={{ background: "#1e1e2d", padding: "1.75rem", borderRadius: "12px", maxWidth: "700px", width: "100%", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                ✏️ Révision de la publication ({editingPost.language.toUpperCase()})
              </h3>
              <StatusBadge status={editingPost.status} />
            </div>

            {editingPost.source_event_title && (
              <p style={{ margin: "-0.4rem 0 1rem", color: "#93c5fd", fontSize: "0.85rem" }}>
                🎟️ Contenu repris de l’événement : {editingPost.source_event_title}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Texte de la publication & Hashtags
                </label>
                <textarea
                  className="input"
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: "100%", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  URL de l'image (Requis pour l'API Buffer)
                </label>
                <input
                  type="url"
                  className="input"
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
                  placeholder="https://media.crush.lu/events/photo-speed-dating.jpg"
                  style={{ width: "100%" }}
                />
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                  💡 L'API Buffer requiert une URL d'image publique (ex: Azure Blob Storage ou média public de l'événement).
                </p>
                {editMediaUrl && (
                  <div style={{ marginTop: "0.5rem", borderRadius: "8px", overflow: "hidden", maxHeight: "150px" }}>
                    <Image src={editMediaUrl} alt="Aperçu visuel" width={600} height={150} unoptimized style={{ width: "100%", height: "150px", objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                    Date et Heure de programmation
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                    Comptes Buffer cibles
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {editingBufferProfiles.length === 0 && (
                      <span style={{ fontSize: "0.8rem", color: "#fca5a5" }}>
                        {bufferError || "Aucun compte Buffer compatible avec cette publication n'est disponible."}
                      </span>
                    )}
                    {editingBufferProfiles.map((bp) => (
                      <label key={bp.id} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(bp.id)}
                          disabled={bp.is_queue_paused}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProfiles([...selectedProfiles, bp.id]);
                            else setSelectedProfiles(selectedProfiles.filter((id) => id !== bp.id));
                          }}
                        />
                        {bp.formatted_username}{bp.is_queue_paused ? " (file en pause)" : ""}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleExpandToArticle}
                  disabled={expandingArticle}
                  style={{ fontSize: "0.85rem" }}
                >
                  {expandingArticle ? "Expansion..." : "📰 Convertir en Article (Publications)"}
                </button>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="button button-secondary" onClick={() => setEditingPost(null)}>
                    Fermer
                  </button>
                  <button type="button" className="button button-secondary" onClick={() => handleSaveAndSchedule("pending_review")}>
                    Mettre en révision
                  </button>
                  <button type="button" className="button button-primary" onClick={() => handleSaveAndSchedule("scheduled")} disabled={submitting || selectedProfiles.length === 0} style={{ background: "#10b981" }}>
                    🚀 Valider & Programmer (Buffer)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Tab 1 (Kanban) or Tab 2 (Calendar) */}
      {loading ? (
        <Panel title="Chargement">
          <p style={{ padding: "2rem", fontStyle: "italic", textAlign: "center" }}>Chargement du planning marketing...</p>
        </Panel>
      ) : activeTab === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {LANES.map((lane) => {
            const lanePosts = posts.filter((p) => lane.statuses.includes(p.status));
            return (
              <Panel key={lane.key} title={lane.title} description={`${lanePosts.length} publication(s)`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: "200px" }}>
                  {lanePosts.length === 0 ? (
                    <p style={{ color: "#71717a", fontSize: "0.85rem", fontStyle: "italic" }}>Aucune publication dans ce statut.</p>
                  ) : (
                    lanePosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => openEditModal(post)}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          padding: "1rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase" }}>
                            {PILLAR_LABEL[post.pillar] || post.pillar}
                          </span>
                          <span style={{ fontSize: "0.8rem" }}>
                            {LANGUAGES.find((l) => l.value === post.language)?.flag || post.language}
                          </span>
                        </div>

                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: 500, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.content}
                        </p>

                        {post.source_event_title && (
                          <div style={{ fontSize: "0.75rem", color: "#93c5fd", marginBottom: "0.5rem" }}>
                            🎟️ {post.source_event_title} · sans IA
                          </div>
                        )}

                        {post.media_url && (
                          <div style={{ fontSize: "0.75rem", color: "#38bdf8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            🖼️ Image rattachée
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                          <StatusBadge status={post.status} />
                          <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                            {post.scheduled_for ? new Date(post.scheduled_for).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Non programmé"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        /* Calendar Tab */
        <Panel title="🗓️ Planning Hebdomadaire des Envois" description="Vue synthétique des publications programmées pour la semaine">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", overflowX: "auto", marginTop: "1rem" }}>
            {weekDays.map((day) => {
              const dayPosts = posts.filter((p) => p.scheduled_for && p.scheduled_for.startsWith(day.dateStr));
              return (
                <div
                  key={day.dateStr}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    minHeight: "280px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.75rem", textAlign: "center", color: "#cbd5e1", paddingBottom: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    {day.label}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {dayPosts.length === 0 ? (
                      <div style={{ fontSize: "0.75rem", color: "#52525b", textAlign: "center", marginTop: "2rem" }}>
                        — Pas de post —
                      </div>
                    ) : (
                      dayPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => openEditModal(p)}
                          style={{
                            background: "#1e1e2d",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid #3b82f6",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                            <span>⏰ {new Date(p.scheduled_for!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>{p.language.toUpperCase()}</span>
                          </div>
                          <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </main>
  );
}
