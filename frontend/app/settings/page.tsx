"use client";

import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";

export default function SettingsPage() {
  const { customer } = useHubData();

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Profile settings"
        title="Account details now, authentication integration later."
        description="This page is intentionally shaped to accept Django-backed profile and permission data."
      />

      <div className="two-up">
        <Panel title="Primary contact" description="Basic customer identity fields.">
          <form className="app-form">
            <label>
              Full name
              <input type="text" defaultValue={customer.primaryContact} />
            </label>
            <label>
              Company
              <input type="text" defaultValue={customer.organization} />
            </label>
            <label>
              Email
              <input type="email" defaultValue={customer.email} />
            </label>
            <label>
              Phone
              <input type="text" defaultValue={customer.phone} />
            </label>
            <button type="button" className="button">
              Save changes
            </button>
          </form>
        </Panel>

        <Panel title="Integration readiness" description="These are the frontend contracts to preserve when Django is added.">
          <ul className="stack-list">
            <li>GET `/api/hub/me` for account context</li>
            <li>GET `/api/hub/requests` for request listing</li>
            <li>POST `/api/hub/requests` for new submissions</li>
            <li>GET `/api/hub/resources` for shared documents</li>
            <li>PATCH `/api/hub/me` for settings updates</li>
          </ul>
        </Panel>
      </div>
    </main>
  );
}
