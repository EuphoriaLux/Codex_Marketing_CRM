"use client";

import { useHubData } from "@/lib/hub-provider";

// Only speaks up when something needs attention: a healthy session is the
// normal state of the hub and needs no banner.
export function StatusBanner() {
  const { authenticated, error, loading, refresh } = useHubData();

  if (loading) return null;

  if (error) {
    return (
      <div className="status-banner warning">
        {error}{" "}
        <button type="button" className="link-button" onClick={() => void refresh()}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="status-banner">
        Connectez-vous via Crush.lu pour charger les données du hub.
      </div>
    );
  }

  return null;
}
