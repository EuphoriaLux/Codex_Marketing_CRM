"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import {
  listWhatsAppMessages,
  listWhatsAppTemplates,
  sendWhatsAppMessage,
  listWhatsAppInbox,
  markWhatsAppInboxRead,
} from "@/lib/api/whatsapp";
import {
  WhatsAppMessage,
  WhatsAppMessageStatus,
  WhatsAppTemplate,
  WhatsAppInboundMessage,
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

  // Inbound inbox state
  const [inbound, setInbound] = useState<WhatsAppInboundMessage[]>([]);
  const [inboundError, setInboundError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

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

    listWhatsAppInbox()
      .then((res) => {
        if (!cancelled) setInbound(res.items);
      })
      .catch(() => {
        if (!cancelled) setInboundError("Unable to load support inbox.");
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

  const inboundRef = useRef(inbound);
  inboundRef.current = inbound;

  const refreshMessages = useCallback(async () => {
    try {
      const latestCreated = messagesRef.current
        .map((m) => m.created_at)
        .sort()
        .pop();
      const res = await listWhatsAppMessages(latestCreated);
      setMessages((prev) => mergeById(prev, res.items));
    } catch {
      setMessagesError("Polling failed; retrying.");
    }
  }, []);

  const refreshInbound = useCallback(async () => {
    try {
      const latestReceived = inboundRef.current
        .map((m) => m.received_at)
        .sort()
        .pop();
      const res = await listWhatsAppInbox(latestReceived);
      if (res.items.length > 0) {
        setInbound((prev) => {
          const map = new Map(prev.map((item) => [item.id, item]));
          for (const item of res.items) map.set(item.id, item);
          return Array.from(map.values()).sort((a, b) =>
            b.received_at.localeCompare(a.received_at),
          );
        });
      }
    } catch {
      setInboundError("Inbound polling failed.");
    }
  }, []);

  // Poll in the background on a continuous basis
  useEffect(() => {
    const id = setInterval(() => {
      void refreshMessages();
      void refreshInbound();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshMessages, refreshInbound]);

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

  // Normalize phone helper to group +352... and 352...
  const normalizePhone = (num: string) => num.replace(/^\+/, "").trim();

  // Combine & group messages by sender/recipient number
  const conversations = useMemo(() => {
    const groups: Record<
      string,
      {
        displayNumber: string;
        contactName: string;
        latestTimestamp: string;
        latestText: string;
        unreadCount: number;
        messages: Array<
          | { type: "outbound"; data: WhatsAppMessage; timestamp: string }
          | { type: "inbound"; data: WhatsAppInboundMessage; timestamp: string }
        >;
      }
    > = {};

    // Group outbound
    for (const m of messages) {
      const norm = normalizePhone(m.recipient);
      if (!groups[norm]) {
        groups[norm] = {
          displayNumber: m.recipient,
          contactName: "",
          latestTimestamp: m.created_at,
          latestText: `Template: ${m.template_name} (${m.status})`,
          unreadCount: 0,
          messages: [],
        };
      }
      groups[norm].messages.push({
        type: "outbound",
        data: m,
        timestamp: m.created_at,
      });
      if (new Date(m.created_at) > new Date(groups[norm].latestTimestamp)) {
        groups[norm].latestTimestamp = m.created_at;
        groups[norm].latestText = `Template: ${m.template_name} (${m.status})`;
      }
    }

    // Group inbound
    for (const msg of inbound) {
      const norm = normalizePhone(msg.from_number);
      if (!groups[norm]) {
        groups[norm] = {
          displayNumber: `+${norm}`,
          contactName: msg.contact_name,
          latestTimestamp: msg.received_at,
          latestText: msg.text || `[${msg.message_type}]`,
          unreadCount: 0,
          messages: [],
        };
      }
      if (msg.contact_name && !groups[norm].contactName) {
        groups[norm].contactName = msg.contact_name;
      }
      groups[norm].messages.push({
        type: "inbound",
        data: msg,
        timestamp: msg.received_at,
      });
      if (!msg.is_read) {
        groups[norm].unreadCount += 1;
      }
      if (new Date(msg.received_at) > new Date(groups[norm].latestTimestamp)) {
        groups[norm].latestTimestamp = msg.received_at;
        groups[norm].latestText = msg.text || `[${msg.message_type}]`;
      }
    }

    // Sort messages in each conversation chronologically
    for (const norm in groups) {
      groups[norm].messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    // Convert to sorted list by latest activity
    return Object.entries(groups)
      .map(([number, data]) => ({ number, ...data }))
      .sort((a, b) => b.latestTimestamp.localeCompare(a.latestTimestamp));
  }, [messages, inbound]);

  // Automatically mark selected chat as read when unread messages are loaded
  useEffect(() => {
    if (!selectedChat) return;
    const conversation = conversations.find((c) => c.number === selectedChat);
    if (!conversation) return;
    const unreadIds = conversation.messages
      .filter((m) => m.type === "inbound" && !m.data.is_read)
      .map((m) => m.data.id);

    if (unreadIds.length === 0) return;

    markWhatsAppInboxRead(unreadIds)
      .then(() => {
        setInbound((prev) =>
          prev.map((msg) =>
            unreadIds.includes(msg.id) ? { ...msg, is_read: true } : msg,
          ),
        );
      })
      .catch((err) => {
        console.error("Failed to mark messages as read:", err);
      });
  }, [selectedChat, conversations]);

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

      {/* Support Chat Inbox workspace */}
      <div style={{ marginTop: "1.5rem" }}>
        <Panel
          title="💬 Live Support Inbox"
          description="Interactive support chat view merging outbound template logs with inbound user replies. New responses load automatically in real-time."
        >
          {inboundError && <p className="form-note" style={{ color: "#b91c1c" }}>{inboundError}</p>}
          
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr",
              border: "1px solid var(--line)",
              borderRadius: 16,
              overflow: "hidden",
              height: 550,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {/* Conversations list sidebar */}
            <div
              style={{
                borderRight: "1px solid var(--line)",
                background: "rgba(255,255,255,0.1)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderBottom: "1px solid var(--line)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Conversations
              </div>
              
              {conversations.length === 0 ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                  No active chats.
                </div>
              ) : (
                conversations.map((chat) => {
                  const isActive = selectedChat === chat.number;
                  return (
                    <button
                      key={chat.number}
                      onClick={() => setSelectedChat(chat.number)}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        border: 0,
                        borderBottom: "1px solid var(--line)",
                        background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        transition: "background 150ms ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
                        <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                          {chat.contactName || chat.displayNumber}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {new Date(chat.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {chat.contactName && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {chat.displayNumber}
                        </span>
                      )}
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.2rem" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "180px",
                          }}
                        >
                          {chat.latestText}
                        </p>
                        
                        {chat.unreadCount > 0 && (
                          <span
                            style={{
                              background: "#b91c1c",
                              color: "white",
                              borderRadius: "999px",
                              padding: "0.1rem 0.4rem",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          >
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected conversation chat view */}
            <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(255,255,255,0.02)" }}>
              {selectedChat ? (() => {
                const chat = conversations.find((c) => c.number === selectedChat);
                if (!chat) return null;
                return (
                  <>
                    {/* Chat Window Header */}
                    <div
                      style={{
                        padding: "0.8rem 1.2rem",
                        borderBottom: "1px solid var(--line)",
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text)" }}>
                          {chat.contactName || chat.displayNumber}
                        </strong>
                        {chat.contactName && (
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.1rem" }}>
                            {chat.displayNumber}
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setRecipient(chat.displayNumber)}
                          style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem" }}
                        >
                          Use number for template
                        </button>
                      </div>
                    </div>

                    {/* Chat Bubble timeline */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "1.2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      {chat.messages.map((m, index) => {
                        const isInbound = m.type === "inbound";
                        return (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: isInbound ? "flex-start" : "flex-end",
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "75%",
                                padding: "0.7rem 0.95rem",
                                borderRadius: 16,
                                borderTopLeftRadius: isInbound ? 4 : 16,
                                borderTopRightRadius: isInbound ? 16 : 4,
                                background: isInbound ? "rgba(255,255,255,0.12)" : "var(--accent)",
                                color: isInbound ? "var(--text)" : "white",
                                border: "1px solid var(--line)",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                              }}
                            >
                              {!isInbound ? (
                                <>
                                  <div style={{ fontWeight: 600, fontSize: "0.82rem", opacity: 0.9 }}>
                                    Template: {m.data.template_name}
                                  </div>
                                  <div style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                                    Language: {m.data.language}
                                  </div>
                                  <div style={{ fontSize: "0.7rem", marginTop: "0.35rem", opacity: 0.7, textAlign: "right" }}>
                                    {m.data.status} · {new Date(m.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontSize: "0.88rem", lineBreak: "anywhere" }}>{m.data.text}</div>
                                  <div style={{ fontSize: "0.7rem", marginTop: "0.35rem", color: "var(--muted)", textAlign: "right" }}>
                                    {new Date(m.data.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })() : (
                <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)", padding: "2rem", textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>💬</div>
                    <strong>Select a conversation</strong>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                      Choose a thread from the left pane to view the chat history.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
