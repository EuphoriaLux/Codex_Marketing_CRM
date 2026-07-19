import { apiGet, apiPost } from "@/lib/api/client";
import {
  WhatsAppInboxResponse,
  WhatsAppMessagesResponse,
  WhatsAppSendResponse,
  WhatsAppTemplatesResponse,
} from "@/lib/api/contracts";

export function listWhatsAppTemplates() {
  return apiGet<WhatsAppTemplatesResponse>("/hub/whatsapp/templates");
}

export function listWhatsAppMessages(since?: string) {
  const qs = since ? `?since=${encodeURIComponent(since)}` : "";
  return apiGet<WhatsAppMessagesResponse>(`/hub/whatsapp/messages${qs}`);
}

export function sendWhatsAppMessage(payload: {
  template_name: string;
  language: string;
  to: string;
  parameters: Record<string, string>;
}) {
  return apiPost<WhatsAppSendResponse>("/hub/whatsapp/send", payload);
}

export function listWhatsAppInbox(since?: string, unreadOnly?: boolean) {
  const params = new URLSearchParams();
  if (since) params.append("since", since);
  if (unreadOnly) params.append("unread", "1");
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiGet<WhatsAppInboxResponse>(`/hub/whatsapp/inbox${qs}`);
}

export function markWhatsAppInboxRead(ids?: string[], all?: boolean) {
  return apiPost<{ updated: number }>("/hub/whatsapp/inbox/read", { ids, all });
}
