"use client";

import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { AnnouncementsPanel } from "@/components/announcements-panel";
import { DevlogPanel } from "@/components/devlog-panel";

export default function DashboardPage() {
  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Tableau de bord"
        title="Bienvenue sur le hub Crush.lu."
        description="Suivez les dernières mises à jour de l'équipe et partagez les informations importantes."
      />

      <AnnouncementsPanel />
      <DevlogPanel />
    </main>
  );
}
