"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  listWhatsAppMessages,
  listWhatsAppTemplates,
  sendWhatsAppMessage,
} from "@/lib/api/whatsapp";
import {
  WhatsAppMessage,
  WhatsAppMessageStatus,
  WhatsAppTemplate,
} from "@/lib/types";

const DEFAULT_RECIPIENT = "+352691930706";
const E164 = /^\+\d{8,15}$/;
const TERMINAL: WhatsAppMessageStatus[] = ["delivered", "read", "failed"];
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;

const STATUS_COLORS: Record<WhatsAppMessageStatus, { bg: string; fg: string }> = {
  queued: { bg: "#e2e8f0", fg: "#475569" },
  sent: { bg: "#dbeafe", fg: "#1e40af" },
  delivered: { bg: "#dcfce7", fg: "#166534" },
  read: { bg: "#bbf7d0", fg: "#14532d" },
  failed: { bg: "#fee2e2", fg: "#991b1b" },
};

function parameterKeys(template: WhatsAppTemplate | undefined): string[] {
  if (!template) return [];
  const body = template.components.find((c) => c.type === "BODY");
  if (!body?.text) return [];
  const matches = body.text.matchAll(/\{\{(\d+)\}\}/g);
  const numbers = new Set<string>();
  for (const m of matches) numbers.add(m[1]);
  return Array.from(numbers).sort((a, b) => Number(a) - Number(b));
}

function mergeById(prev: WhatsAppMessage[], incoming: WhatsAppMessage[]): WhatsAppMessage[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

function StatusBadge({ status }: { status: WhatsAppMessageStatus }) {
  const { bg, fg } = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.18rem 0.55rem",
        borderRadius: 6,
        background: bg,
        color: fg,
        fontSize: "0.78rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {status}
    </span>
  );
}

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [params, setParams] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [openTimelines, setOpenTimelines] = useState<Record<string, boolean>>({});

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.name === selectedTemplateName),
    [templates, selectedTemplateName],
  );
  const paramKeys = useMemo(() => parameterKeys(selectedTemplate), [selectedTemplate]);

  useEffect(() => {
    let cancelled = false;
    listWhatsAppTemplates()
      .then((res) => {
        if (cancelled) return;
        setTemplates(res.items);
        const firstApproved = res.items.find((t) => t.status === "APPROVED");
        const fallback = res.items[0];
        const initial = firstApproved ?? fallback;
        if (initial) setSelectedTemplateName(initial.name);
      })
      .catch(() => {
        if (!cancelled) setTemplatesError("Unable to load templates.");
      });

    listWhatsAppMessages()
      .then((res) => {
        if (!cancelled) setMessages(res.items);
      })
      .catch(() => {
        if (!cancelled) setMessagesError("Unable to load message history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setParams({});
  }, [selectedTemplateName]);

  const pendingMessageIds = useMemo(() => {
    const now = Date.now();
    return messages
      .filter(
        (m) =>
          !TERMINAL.includes(m.status) &&
          now - new Date(m.created_at).getTime() < POLL_TIMEOUT_MS,
      )
      .map((m) => m.id);
  }, [messages]);

  const hasPending = pendingMessageIds.length > 0;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const refreshMessages = useCallback(async () => {
    try {
      const latestCreated = messagesRef.current
        .map((m) => m.created_at)
        .sort()
        .pop();
      const res = await listWhatsAppMessages(latestCreated);
      setMessages((prev) => mergeById(prev, res.items));
    } catch {
      // surface a soft error but don't tear down the page
      setMessagesError("Polling failed; retrying.");
    }
  }, []);

  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(refreshMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasPending, refreshMessages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);

    if (!selectedTemplate) {
      setSendError("Select a template first.");
      return;
    }
    if (!E164.test(recipient)) {
      setSendError("Recipient must be E.164 (e.g. +352691930706).");
      return;
    }

    setSending(true);
    try {
      const res = await sendWhatsAppMessage({
        template_name: selectedTemplate.name,
        language: selectedTemplate.language,
        to: recipient,
        parameters: params,
      });
      setMessages((prev) => mergeById(prev, [res.message]));
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  const webhookConfirmed = messages.some(
    (m) => m.status === "delivered" || m.status === "read",
  );

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Messaging integration"
        title="WhatsApp Cloud API — send & verify webhook"
        description="Sends a template via the Django backend and polls /hub/whatsapp/messages so Meta's status webhook (sent → delivered → read) is visible end-to-end."
      />

      <div className="two-up">
        <Panel
          title="Send template"
          description="Backed by POST /hub/whatsapp/send. Meta credentials live on the Django side; the bearer token never enters the browser."
        >
          <form className="app-form" onSubmit={handleSend}>
            <label>
              Template
              {templatesError ? (
                <p className="form-note">{templatesError}</p>
              ) : (
                <select
                  value={selectedTemplateName}
                  onChange={(e) => setSelectedTemplateName(e.target.value)}
                  disabled={templates.length === 0}
                >
                  {templates.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : null}
                  {templates.map((t) => (
                    <option key={`${t.name}:${t.language}`} value={t.name}>
                      {t.name} ({t.language}) — {t.status}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label>
              Recipient (E.164)
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+352691930706"
              />
            </label>

            {paramKeys.map((key) => (
              <label key={key}>
                Parameter {`{{${key}}}`}
                <input
                  type="text"
                  value={params[key] ?? ""}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </label>
            ))}

            <button type="submit" className="button" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </button>

            {sendError ? <p className="form-note">{sendError}</p> : null}
          </form>
        </Panel>

        <Panel
          title="Message log"
          description={
            webhookConfirmed
              ? "Webhook confirmed: at least one message advanced past 'sent'."
              : "Polls every 3s while any message is pending. Status advances past 'sent' only when Meta's webhook reaches Django."
          }
        >
          {messagesError ? <p className="form-note">{messagesError}</p> : null}
          {messages.length === 0 ? (
            <p className="form-note">No messages yet. Send one to start.</p>
          ) : (
            <div className="stack-list" style={{ display: "grid", gap: "0.75rem" }}>
              {messages.map((m) => {
                const open = !!openTimelines[m.id];
                return (
                  <div
                    key={m.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "0.75rem 0.9rem",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.template_name}</div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          → {m.recipient} · {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTimelines((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                      }
                      style={{
                        marginTop: "0.5rem",
                        background: "transparent",
                        border: "none",
                        color: "#3730a3",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {open ? "Hide timeline" : `Show timeline (${m.status_history.length})`}
                    </button>
                    {open ? (
                      <ul
                        style={{
                          marginTop: "0.5rem",
                          paddingLeft: "1.1rem",
                          fontSize: "0.82rem",
                          color: "#334155",
                        }}
                      >
                        {m.status_history.map((e, i) => (
                          <li key={`${m.id}:${i}`}>
                            <strong>{e.status}</strong>{" "}
                            <span style={{ color: "#64748b" }}>
                              {new Date(e.timestamp).toLocaleString()}
                            </span>
                            {e.error_message ? (
                              <span style={{ color: "#991b1b" }}> — {e.error_message}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}
