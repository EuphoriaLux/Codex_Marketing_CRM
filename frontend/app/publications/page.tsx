"use client";

import { SectionHeader } from "@/components/section-header";
import { AnnouncementsEditor } from "@/components/announcements-editor";
import { DevlogEditor } from "@/components/devlog-editor";

export default function PublicationsPage() {
  return (
    <main className="page">
      <SectionHeader
        eyebrow="📢 Publications"
        title="Gérer les informations et le devlog."
        description="Ajoutez ou retirez les entrées qui s'affichent sur le tableau de bord. L'accès sera limité par droits ultérieurement."
      />

      <AnnouncementsEditor />
      <DevlogEditor />
    </main>
  );
}
