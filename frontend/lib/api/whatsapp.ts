import { apiGet, apiPost } from "@/lib/api/client";
import {
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
