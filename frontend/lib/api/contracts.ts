import {
  CustomerSnapshot,
  RequestItem,
  ResourceItem,
  SocialEventSuggestion,
  SocialPost,
  WhatsAppInboundMessage,
  WhatsAppMessage,
  WhatsAppTemplate,
} from "@/lib/types";

export type MeResponse = {
  customer: CustomerSnapshot;
};

export type RequestsResponse = {
  items: RequestItem[];
};

export type ResourcesResponse = {
  items: ResourceItem[];
};

export type TimelineResponse = {
  items: {
    id: string;
    date: string;
    title: string;
    description: string;
  }[];
};

export type WhatsAppTemplatesResponse = { items: WhatsAppTemplate[] };
export type WhatsAppMessagesResponse = { items: WhatsAppMessage[] };
export type WhatsAppSendResponse = { message: WhatsAppMessage };

export type SocialPostsResponse = { items: SocialPost[] };
export type SocialPostResponse = { post: SocialPost };
export type SocialUpcomingEventsResponse = { items: SocialEventSuggestion[] };
export type SocialEventDraftsResponse = {
  posts: SocialPost[];
  created_count: number;
  reused_count: number;
  copy_source: "event";
};
// POST /hub/social/generate returns one draft per requested language.
export type SocialGenerateResponse = { posts: SocialPost[]; warnings?: string[] };
export type BufferProfilesResponse = { items: import("@/lib/types").BufferProfile[] };
export type ExpandArticleResponse = { article_id: string; title: string; content: string };

export type WhatsAppInboxResponse = {
  items: WhatsAppInboundMessage[];
  unread_count: number;
};
