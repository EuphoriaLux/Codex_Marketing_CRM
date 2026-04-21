"use client";

import { useHubData } from "@/lib/hub-provider";

export function Topbar() {
  const { customer, source, loading, refresh } = useHubData();

  return (
    <header className="topbar">
      <div>
        <p className="topbar-label">Portal mode</p>
        <strong>{loading ? "Loading customer context" : "Client-side app shell"}</strong>
      </div>
      <div className="topbar-actions">
        <span className={`source-badge ${source}`}>
          {source === "api" ? "Django API" : "Mock data"}
        </span>
        <span className="topbar-contact">
          {customer.primaryContact || "No contact loaded"}
        </span>
        <button type="button" className="button secondary" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
    </header>
  );
}
