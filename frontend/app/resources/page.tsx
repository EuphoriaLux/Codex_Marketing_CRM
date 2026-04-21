"use client";

import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";

export default function ResourcesPage() {
  const { resources } = useHubData();

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Resource center"
        title="Shared assets, guides, and project references in one place."
        description="A dedicated customer hub should not make people hunt through emails for every document."
      />

      <div className="resource-grid">
        {resources.map((resource) => (
          <Panel key={resource.id} title={resource.title} description={resource.summary}>
            <div className="resource-meta">
              <span className="resource-type">{resource.type}</span>
              <span>{resource.updatedAt}</span>
            </div>
            <button type="button" className="button secondary">
              Open resource
            </button>
          </Panel>
        ))}
      </div>
    </main>
  );
}
