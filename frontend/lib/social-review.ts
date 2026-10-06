import type { BufferProfile, SocialPost } from "./types";

export const POSTING_TIMEZONE = "Europe/Luxembourg";

export function luxembourgInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: POSTING_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function luxembourgIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choisissez une date et une heure.");
  const intended = Date.parse(`${value}:00Z`);
  let candidate = intended;
  for (let i = 0; i < 3; i++) {
    candidate += intended - Date.parse(`${luxembourgInput(new Date(candidate).toISOString())}:00Z`);
  }
  const iso = new Date(candidate).toISOString();
  if (luxembourgInput(iso) !== value) throw new Error("Cette heure n'existe pas au Luxembourg lors du changement d'heure.");
  if ([-3600000, 3600000].some((delta) => luxembourgInput(new Date(candidate + delta).toISOString()) === value)) {
    throw new Error("Cette heure existe deux fois au Luxembourg : choisissez une heure après 03:00.");
  }
  return iso;
}

export function formatPostingTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: POSTING_TIMEZONE, weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function eligibleProfile(profile: BufferProfile): boolean {
  return !profile.is_queue_paused && !profile.is_disconnected && !profile.is_locked;
}

export function defaultReviewProfiles(post: SocialPost, profiles: BufferProfile[]): BufferProfile[] | null {
  const available = profiles.filter(eligibleProfile);
  if (post.buffer_profile_ids?.length) {
    const selected = available.filter((p) => post.buffer_profile_ids!.includes(p.id));
    return selected.length === post.buffer_profile_ids.length ? selected : null;
  }
  const networks = post.platforms.length ? post.platforms : [...new Set(available.map((p) => p.service))];
  const selected = networks.map((service) => available.filter((p) => p.service === service));
  return selected.length && selected.every((items) => items.length === 1) ? selected.flat() : null;
}

export function reviewTime(post: SocialPost): string | null {
  return post.posting_suggestion?.scheduled_for ?? (post.posting_suggestion ? null : post.scheduled_for);
}

export function reviewBlocker(post: SocialPost, profiles: BufferProfile[]): string | null {
  if (post.buffer_id || !["draft", "pending_review", "approved"].includes(post.status)) return "Déjà envoyé ou à réconcilier dans Buffer.";
  if (!post.content.trim()) return "Ajoutez le texte de la publication.";
  if (!post.review_fingerprint) return "Ouvrez la publication pour vérifier sa programmation.";
  const time = reviewTime(post);
  if (!time || !Number.isFinite(Date.parse(time)) || Date.parse(time) <= Date.now()) return post.posting_suggestion?.reason || "Choisissez un horaire futur.";
  const selected = defaultReviewProfiles(post, profiles);
  if (!selected) return "Choisissez les comptes de publication.";
  if (post.media_type === "video" && selected.some(p => !["instagram", "facebook"].includes(p.service))) return "Les vidéos sont disponibles pour Instagram et Facebook.";
  if (selected.some((p) => p.service === "instagram") && !(post.media_urls?.length || post.media_url)) return "Instagram nécessite une image.";
  return null;
}
