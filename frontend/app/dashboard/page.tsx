"use client";

import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { HeroStats } from "@/components/hero-stats";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";

export default function DashboardPage() {
  const { metrics, requests, resources, timeline } = useHubData();

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Customer dashboard"
        title="Everything the customer needs, without exposing internal complexity."
        description="This view is now driven by one client-side store so the portal behaves like a proper application."
      />

      <HeroStats metrics={metrics} />

      <section className="dashboard-grid">
        <Panel title="Recent requests" description="Most active account conversations.">
          <div className="item-list">
            {requests.slice(0, 3).map((request) => (
              <article key={request.id} className="item-card">
                <div className="item-row">
                  <h3>{request.subject}</h3>
                  <span className={`pill ${request.priority.toLowerCase()}`}>{request.priority}</span>
                </div>
                <p>{request.summary}</p>
                <small>{request.status}</small>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Shared resources" description="Guides, documents, and project material.">
          <div className="resource-list">
            {resources.map((resource) => (
              <article key={resource.id} className="resource-card">
                <span className="resource-type">{resource.type}</span>
                <h3>{resource.title}</h3>
                <p>{resource.summary}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Account timeline" description="A lightweight feed works well for customers before full ticketing is added.">
        <div className="timeline">
          {timeline.map((event) => (
            <article key={event.id} className="timeline-item">
              <span>{event.date}</span>
              <div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
