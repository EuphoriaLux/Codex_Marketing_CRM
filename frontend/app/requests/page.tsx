"use client";

import { FormEvent, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { useHubData } from "@/lib/hub-provider";

export default function RequestsPage() {
  const { requests } = useHubData();
  const [draftSaved, setDraftSaved] = useState(false);

  function handleDraftSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftSaved(true);
  }

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Support and service"
        title="Customer requests should feel clear, traceable, and calm."
        description="This page already behaves like an SPA form surface and can later POST directly to your backend."
      />

      <div className="request-layout">
        <Panel title="Create a new request" description="The current action is local, but the same form shape can post to your API later.">
          <form className="app-form" onSubmit={handleDraftSave}>
            <label>
              Subject
              <input type="text" placeholder="Website update for May campaign" />
            </label>
            <label>
              Category
              <select defaultValue="project">
                <option value="project">Project</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
              </select>
            </label>
            <label>
              Priority
              <select defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Message
              <textarea rows={5} placeholder="Describe the change, context, and deadline." />
            </label>
            <button type="submit" className="button">
              Save draft
            </button>
            {draftSaved ? (
              <p className="form-note">
                Draft captured locally. Replace this with a `POST /api/hub/requests`
                call when the backend is ready.
              </p>
            ) : null}
          </form>
        </Panel>

        <Panel title="Existing requests" description="The customer should always understand what is moving and what is waiting.">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.subject}</td>
                    <td>{request.category}</td>
                    <td>{request.priority}</td>
                    <td>{request.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}
