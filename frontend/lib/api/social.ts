import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import {
  BufferProfilesResponse,
  ExpandArticleResponse,
  SocialGenerateResponse,
  SocialPostResponse,
  SocialPostsResponse,
} from "@/lib/api/contracts";
import {
  SocialLanguage,
  SocialPillar,
  SocialPlatform,
  SocialPostStatus,
} from "@/lib/types";

// Social media planning client. Follows the /hub/* host convention (these
// routes sit directly on the API host, not under /api/hub/*) and reuses the
// shared bearer-token wrappers — Buffer and Claude credentials stay on the
// Django side and never reach the browser.

// GET /hub/social/posts[?status=draft] — board feed, newest first.
export function listSocialPosts(status?: SocialPostStatus) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<SocialPostsResponse>(`/hub/social/posts${qs}`);
}

// GET /hub/social/buffer-profiles — connected Buffer social accounts.
export function listBufferProfiles() {
  return apiGet<BufferProfilesResponse>("/hub/social/buffer-profiles");
}

// GET /hub/social/upcoming-events — active events list.
export function listUpcomingEvents() {
  return apiGet<{ items: { id: string; title: string; event_type: string; date: string; location: string; image_url: string }[] }>("/hub/social/upcoming-events");
}

// GET /hub/social/kpis-summary — real-time KPI metrics snapshot.
export function listKpisSummary() {
  return apiGet<{ kpis: Record<string, string> }>("/hub/social/kpis-summary");
}

// GET /hub/social/featured-profiles — anonymized member profiles.
export function listFeaturedProfiles() {
  return apiGet<{ items: { id: string; first_name: string; age: string; region: string; passions: string[]; bio_quote: string }[] }>("/hub/social/featured-profiles");
}

// POST /hub/social/generate — Django calls the Claude API server-side and
// returns one draft (status: "draft") per requested language across the 5 categories.
export function generateDrafts(payload: {
  category?: "events" | "kpis" | "profiles" | "tips" | "recaps";
  hook: string;
  pillar: SocialPillar;
  platforms: SocialPlatform[];
  languages: SocialLanguage[];
  event_id?: string;
  stats?: { value: string; label: string }[];
  profile_id?: string;
  week_start?: string;
}) {
  return apiPost<SocialGenerateResponse>("/hub/social/generate", payload);
}

// POST /hub/social/posts — create a single draft by hand (no AI).
export function createSocialPost(payload: {
  hook: string;
  pillar: SocialPillar;
  language: SocialLanguage;
  platforms: SocialPlatform[];
  content: string;
  media_url?: string | null;
}) {
  return apiPost<SocialPostResponse>("/hub/social/posts", payload);
}

// PATCH /hub/social/posts/:id — edit content/media, advance status, or set the
// schedule. The status→scheduled transition is where Django queues the push to
// Buffer; the published/failed states then come back from Buffer's side.
export function updateSocialPost(
  id: string,
  payload: Partial<{
    content: string;
    media_url: string | null;
    status: SocialPostStatus;
    scheduled_for: string | null;
    buffer_profile_ids?: string[];
  }>,
) {
  return apiPatch<SocialPostResponse>(`/hub/social/posts/${id}`, payload);
}

// POST /hub/social/posts/:id/expand-article — expand social post into a long-form article draft.
export function expandPostToArticle(id: string) {
  return apiPost<ExpandArticleResponse>(`/hub/social/posts/${id}/expand-article`, {});
}
