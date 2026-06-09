"use client";

import { SectionHeader } from "@/components/section-header";
import { HeroStats } from "@/components/hero-stats";
import { StatusBanner } from "@/components/status-banner";
import { DevlogPanel } from "@/components/devlog-panel";
import { AnnouncementsPanel } from "@/components/announcements-panel";
import { useHubData } from "@/lib/hub-provider";

export default function DashboardPage() {
  const { metrics } = useHubData();

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Tableau de bord"
        title="Bienvenue sur le hub Crush.lu."
        description="Suivez les dernières mises à jour de l'équipe et partagez les informations importantes."
      />

      <HeroStats metrics={metrics} />

      <DevlogPanel />
      <AnnouncementsPanel />
    </main>
  );
}
