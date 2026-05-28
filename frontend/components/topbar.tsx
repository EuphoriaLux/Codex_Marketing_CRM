"use client";

import { useHubData } from "@/lib/hub-provider";

export function Topbar() {
  const { customer, authenticated, loading, refresh } = useHubData();

  return (
    <header className="topbar">
      <div>
        <p className="topbar-label">Portal mode</p>
        <strong>{loading ? "Loading customer context" : "Client-side app shell"}</strong>
      </div>
      <div className="topbar-actions">
        <span className="topbar-contact">
          {authenticated
            ? customer.primaryContact || "No contact loaded"
            : "Not signed in"}
        </span>
        <button type="button" className="button secondary" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
    </header>
  );
}
