"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearTokens } from "@/lib/api/client";

type RoleKey = "founder" | "cofounder" | "accountant" | "employee";

type RoleProfile = {
  name: string;
  role: string;
  avatar: string;
};

const ROLE_PROFILES: Record<RoleKey, RoleProfile> = {
  founder:    { name: "Sébastien", role: "Fondateur",    avatar: "S" },
  cofounder:  { name: "Romain",    role: "Co-fondateur", avatar: "R" },
  accountant: { name: "Claire",    role: "Comptable",    avatar: "C" },
  employee:   { name: "Julien",    role: "Employé",      avatar: "J" },
};

const STORAGE_KEY = "crush_dev_role";

export function Topbar() {
  const router = useRouter();
  const [roleKey, setRoleKey] = useState<RoleKey>("founder");
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in ROLE_PROFILES) setRoleKey(stored as RoleKey);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function pickRole(next: RoleKey) {
    setRoleKey(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setOpen(false);
  }

  function handleLogout() {
    clearTokens();
    setOpen(false);
    router.replace("/");
  }

  const profile = ROLE_PROFILES[roleKey];

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
          <div className="avatar-circle">{profile.avatar}</div>
          <div>
            <div className="user-name">{profile.name}</div>
            <div className="user-role">{profile.role}</div>
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
              <div className="menu-section">
                🧪 Voir comme
                <span className="dev-chip">DEV</span>
              </div>
              {(Object.keys(ROLE_PROFILES) as RoleKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`menu-item${roleKey === key ? " active" : ""}`}
                  onClick={() => pickRole(key)}
                >
                  <span className="role-radio" />
                  {ROLE_PROFILES[key].role}
                </button>
              ))}

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
