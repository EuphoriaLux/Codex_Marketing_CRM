"use client";

import { SectionHeader } from "@/components/section-header";

type TeamMember = {
  name: string;
  role: string;
  initial: string;
  gradient: string;
  events: number | string;
  presence: string;
};

const MEMBERS: TeamMember[] = [
  { name: "Tom",    role: "Fondateur",    initial: "T", gradient: "linear-gradient(135deg, #6366f1, #ec4899)", events: "—", presence: "—" },
  { name: "Wesley", role: "Co-fondateur", initial: "W", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", events: "—", presence: "—" },
];

export default function TeamPage() {
  return (
    <main className="page">
      <SectionHeader
        eyebrow="👥 Équipe"
        title="Membres de Crush.lu."
        description="L'équipe au complet : statuts, postes et performances."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {MEMBERS.map((m) => (
          <div
            key={m.name}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: "1.2rem 1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: m.gradient,
                color: "white",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 0.7rem",
                fontWeight: 700,
                fontSize: "1.5rem",
              }}
            >
              {m.initial}
            </div>
            <strong style={{ fontSize: "1rem" }}>{m.name}</strong>
            <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
              {m.role}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginTop: "0.9rem",
                paddingTop: "0.8rem",
                borderTop: "1px solid var(--line)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{m.events}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Events
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{m.presence}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Présence
                </div>
              </div>
            </div>
          </div>
        ))}

        <div
          style={{
            background: "var(--surface)",
            border: "1px dashed var(--line-strong)",
            borderRadius: 16,
            padding: "1.2rem 1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--glass)",
              color: "var(--muted)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 0.7rem",
              fontWeight: 400,
              fontSize: "1.8rem",
            }}
          >
            +
          </div>
          <strong>Inviter un membre</strong>
          <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            Email · Crush.lu
          </div>
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: "0.9rem", width: "100%" }}
          >
            Envoyer invitation
          </button>
        </div>
      </div>
    </main>
  );
}
