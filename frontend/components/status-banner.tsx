"use client";

import { useHubData } from "@/lib/hub-provider";

export function StatusBanner() {
  const { source, error, loading } = useHubData();

  if (loading) {
    return <div className="status-banner">Loading portal data...</div>;
  }

  if (error) {
    return <div className="status-banner warning">{error}</div>;
  }

  if (source === "mock") {
    return (
      <div className="status-banner">
        Running in SPA fallback mode. Connect Django later by implementing the
        `/api/hub/*` endpoints.
      </div>
    );
  }

  return (
    <div className="status-banner success">
      Connected to the backend API. The frontend is running as a client-side app.
    </div>
  );
}
