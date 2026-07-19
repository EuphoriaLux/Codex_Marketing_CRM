import {
  CustomerSnapshot,
  RequestItem,
  ResourceItem,
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
// POST /hub/social/generate returns one draft per requested language.
export type SocialGenerateResponse = { posts: SocialPost[] };

export type WhatsAppInboxResponse = {
  items: WhatsAppInboundMessage[];
  unread_count: number;
};
