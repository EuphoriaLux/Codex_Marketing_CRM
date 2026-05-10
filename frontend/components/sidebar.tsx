"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "Requests" },
  { href: "/resources", label: "Resources" },
  { href: "/locations", label: "Locations" },
  { href: "/partnership-admin", label: "Partnership" },
  { href: "/calculator", label: "Events Calculator" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">C</div>
        <div className="brand-copy">
          <h1>Crush Hub</h1>
          <p>Frontend-first customer portal</p>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-foot">
        <strong>Django later</strong>
        <p>
          The UI is already structured around account, request, and resource
          endpoints so the backend can be attached without redesigning the app.
        </p>
      </div>
    </aside>
  );
}
