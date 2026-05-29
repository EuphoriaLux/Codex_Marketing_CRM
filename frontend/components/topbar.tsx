"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/api/client";
import { useHubData } from "@/lib/hub-provider";

export function Topbar() {
  const router = useRouter();
  const { customer } = useHubData();
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <header className="topbar">
      <div className="topbar-search">
        <span>🔍</span>
        <span>Rechercher…</span>
      </div>

      <div className="topbar-actions">
        <button type="button" className="icon-btn" aria-label="Notifications">
          🔔
          <span className="badge-dot" />
        </button>

        <div
          className="user-chip"
          ref={chipRef}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="avatar-circle">{avatarLetter}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{customer.organization || "Crush Hub"}</div>
          </div>
          <span className="chev">▾</span>

          {open ? (
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
              <Link href="/settings" className="menu-item">
                <span>👤</span> Profil
              </Link>
              <Link href="/settings" className="menu-item">
                <span>⚙</span> Paramètres
              </Link>

              <div className="menu-divider" />
              <button type="button" className="menu-item" onClick={handleLogout}>
                <span>🚪</span> Se déconnecter
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
