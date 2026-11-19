"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QuickSearch } from "@/components/quick-search";
import { logout } from "@/lib/api/client";
import { listWhatsAppInbox } from "@/lib/api/whatsapp";
import { useHubData } from "@/lib/hub-provider";

const UNREAD_POLL_MS = 60_000;

// Unread WhatsApp support messages, refreshed every minute while the tab is
// visible. null = unknown (not loaded or endpoint failing): no badge.
function useWhatsAppUnread(enabled: boolean): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await listWhatsAppInbox(undefined, true);
        if (!cancelled) setCount(res.unread_count ?? 0);
      } catch {
        if (!cancelled) setCount(null);
      }
    }

    void poll();
    const timer = window.setInterval(poll, UNREAD_POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [enabled]);

  return count;
}

export function Topbar() {
  const router = useRouter();
  const { customer, authenticated } = useHubData();
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);
  const unread = useWhatsAppUnread(authenticated);

  const displayName = customer.primaryContact || customer.email || "—";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  const bellLabel =
    unread === null
      ? "WhatsApp Support"
      : unread > 0
        ? `${unread} message${unread > 1 ? "s" : ""} WhatsApp non lu${unread > 1 ? "s" : ""}`
        : "Aucun message WhatsApp non lu";

  return (
    <header className="topbar">
      <QuickSearch />

      <div className="topbar-actions">
        <Link href="/whatsapp" className="icon-btn" aria-label={bellLabel} title={bellLabel}>
          🔔
          {unread ? <span className="badge-count">{unread > 99 ? "99+" : unread}</span> : null}
        </Link>

        <div className="user-chip" ref={chipRef}>
          <button
            type="button"
            className="user-chip-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="avatar-circle">{avatarLetter}</div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{customer.organization || "Crush Hub"}</div>
            </div>
            <span className="chev">▾</span>
          </button>

          {open ? (
            <div className="user-menu" role="menu">
              <Link href="/settings" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
                <span>👤</span> Mon profil
              </Link>
              <div className="menu-divider" />
              <button type="button" className="menu-item" role="menuitem" onClick={handleLogout}>
                <span>🚪</span> Se déconnecter
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
