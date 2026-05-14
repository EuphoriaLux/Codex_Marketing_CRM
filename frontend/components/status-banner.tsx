"use client";

import { useHubData } from "@/lib/hub-provider";

export function StatusBanner() {
  const { authenticated, error, loading } = useHubData();

  if (loading) {
    return <div className="status-banner">Loading portal data...</div>;
  }

  if (error) {
    return <div className="status-banner warning">{error}</div>;
  }

  if (!authenticated) {
    return (
      <div className="status-banner">
        Sign in to load your portal data from the backend API.
      </div>
    );
  }

  return (
    <div className="status-banner success">
      Connected to the backend API. The frontend is running as a client-side app.
    </div>
  );
}
