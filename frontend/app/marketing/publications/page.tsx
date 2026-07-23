"use client";

import { SectionHeader } from "@/components/section-header";
import { AnnouncementsEditor } from "@/components/announcements-editor";
import { DevlogEditor } from "@/components/devlog-editor";

export default function MarketingPublicationsPage() {
  return (
    <main className="page">
      <SectionHeader
        eyebrow="📢 Section Marketing • Publications"
        title="Gérer les Articles, Annonces et Devlog"
        description="Créez, révisez et gérez les articles d'actualité et les communications officielles Crush.lu. Les posts sociaux convertis en articles apparaissent ici."
      />

      <AnnouncementsEditor />
      <DevlogEditor />
    </main>
  );
}
