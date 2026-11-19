"use client";

import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { AnnouncementsPanel } from "@/components/announcements-panel";
import { DevlogPanel } from "@/components/devlog-panel";
import { TodayCockpit } from "@/components/today-cockpit";
import { useHubData } from "@/lib/hub-provider";

function greeting(hour: number): string {
  if (hour < 5 || hour >= 18) return "Bonsoir";
  return "Bonjour";
}

export default function DashboardPage() {
  const { customer } = useHubData();
  const firstName = customer.primaryContact.split(" ")[0];
  const hello = greeting(
    Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: "Europe/Luxembourg",
      }).format(new Date()),
    ),
  );

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Tableau de bord"
        title={firstName ? `${hello} ${firstName}.` : `${hello}.`}
        description="Ce qui demande votre attention aujourd'hui, puis les dernières nouvelles de l'équipe."
      />

      <TodayCockpit />
      <AnnouncementsPanel />
      <DevlogPanel />
    </main>
  );
}
