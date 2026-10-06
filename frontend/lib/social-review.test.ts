import test from "node:test";
import assert from "node:assert/strict";
import { defaultReviewProfiles, luxembourgInput, luxembourgIso, reviewBlocker, reviewTime } from "./social-review.ts";
import type { BufferProfile, SocialPost } from "./types.ts";

const profiles = [
  { id: "ig", service: "instagram", formatted_username: "Crush.lu" },
  { id: "fb", service: "facebook", formatted_username: "Crush.lu" },
] as BufferProfile[];
const post = {
  id: "review", created_by: "test", pillar: "dating_tip", language: "en", hook: "Advice",
  media_url: "https://cdn.crush.lu/1.png", status_history: [], created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z",
  status: "pending_review", content: "Caption", platforms: ["instagram", "facebook"],
  buffer_profile_ids: [], buffer_id: "", media_urls: ["https://cdn.crush.lu/1.png"],
  review_fingerprint: "reviewed", scheduled_for: "2099-10-08T16:30:00Z",
} as SocialPost;

test("Luxembourg editor preserves summer and winter instants regardless of device timezone", () => {
  assert.equal(luxembourgInput("2026-10-08T16:30:00Z"), "2026-10-08T18:30");
  assert.equal(luxembourgIso("2026-10-08T18:30"), "2026-10-08T16:30:00.000Z");
  assert.equal(luxembourgIso("2026-10-26T18:30"), "2026-10-26T17:30:00.000Z");
});

test("DST missing or ambiguous local times require explicit correction", () => {
  assert.throws(() => luxembourgIso("2026-03-29T02:30"), /n'existe pas/);
  assert.throws(() => luxembourgIso("2026-10-25T02:30"), /deux fois/);
});

test("video approvals require supported, resolved channels", () => {
  const video = {...post, media_type:"video", media_urls:[], media_url:"https://cdn.crush.lu/clip.mp4"} as SocialPost;
  assert.equal(reviewBlocker(video, profiles), null);
  assert.match(reviewBlocker({...video, platforms:["linkedin"]}, [{id:"li",service:"linkedin",formatted_username:"Crush"}])!, /Instagram et Facebook/);
});

test("empty saved account list defaults to one connected account per platform", () => {
  assert.deepEqual(defaultReviewProfiles(post, profiles)?.map((p) => p.id), ["ig", "fb"]);
  assert.equal(reviewBlocker(post, profiles), null);
});

test("ambiguous or disconnected account selection requires review", () => {
  assert.equal(defaultReviewProfiles(post, [...profiles, { ...profiles[0], id: "other-ig" }]), null);
  assert.equal(defaultReviewProfiles({ ...post, buffer_profile_ids: ["ig", "fb"] }, profiles.map((p) => ({ ...p, is_disconnected: true }))), null);
  assert.match(reviewBlocker(post, [])!, /comptes/);
});

test("expired source proposal cannot fall back to an old reserved time", () => {
  const expired = { ...post, posting_suggestion: { scheduled_for: null, reason: "Source passée", timezone: "Europe/Luxembourg", latest_before: null } };
  assert.equal(reviewTime(expired), null);
  assert.equal(reviewBlocker(expired, profiles), "Source passée");
  assert.ok(reviewBlocker({ ...post, scheduled_for: "invalid" }, profiles));
});

test("missing Instagram image, stale approval, and completed dispatch block quick approval", () => {
  assert.match(reviewBlocker({ ...post, media_urls: [], media_url: null }, profiles)!, /image/);
  assert.ok(reviewBlocker({ ...post, review_fingerprint: undefined }, profiles));
  assert.ok(reviewBlocker({ ...post, buffer_id: "sent" }, profiles));
});
