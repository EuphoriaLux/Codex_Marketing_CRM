import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import {
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

// POST /hub/social/generate — Django calls the Claude API server-side and
// returns one draft (status: "draft") per requested language.
export function generateDrafts(payload: {
  hook: string;
  pillar: SocialPillar;
  platforms: SocialPlatform[];
  languages: SocialLanguage[];
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
  }>,
) {
  return apiPatch<SocialPostResponse>(`/hub/social/posts/${id}`, payload);
}
