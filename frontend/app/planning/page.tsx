"use client";

import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";

const DAYS = [
  { label: "Lun 26", today: false, shifts: [{ type: "off", who: "Off", info: "Repos équipe" }] },
  { label: "Mar 27", today: false, shifts: [{ type: "work", who: "Marie", info: "14h–18h · Prépa" }] },
  {
    label: "Mer 28",
    today: false,
    shifts: [
      { type: "work", who: "Julien", info: "10h–17h · Office" },
      { type: "free", who: "Claire", info: "10h–14h · Compta" },
    ],
  },
  {
    label: "Jeu 29 · Aujourd'hui",
    today: true,
    shifts: [
      { type: "work", who: "Marie", info: "14h–22h · Briefing" },
      { type: "work", who: "Julien", info: "16h–22h · Logistique" },
    ],
  },
  {
    label: "Ven 30",
    today: false,
    shifts: [
      { type: "event", who: "🍷 Wine tasting", info: "19h–23h · La Cave" },
      { type: "work", who: "Sébastien · Romain", info: "19h–23h" },
    ],
  },
  { label: "Sam 31", today: false, shifts: [{ type: "off", who: "—", info: "Aucun shift" }] },
  { label: "Dim 1", today: false, shifts: [{ type: "off", who: "Off", info: "Repos équipe" }] },
];

const shiftStyle: Record<string, React.CSSProperties> = {
  work: {
    background: "rgba(99,102,241,0.18)",
    borderColor: "rgba(99,102,241,0.4)",
  },
  free: {
    background: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.35)",
  },
  off: {
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    color: "var(--muted)",
  },
  event: {
    background: "rgba(244,63,94,0.15)",
    borderColor: "rgba(244,63,94,0.4)",
  },
};

export default function PlanningPage() {
  return (
    <main className="page">
      <SectionHeader
        eyebrow="🗓️ Planning équipe"
        title="Planning de la semaine."
        description="Visualise les disponibilités de chaque membre et attribue les événements à venir."
      />

      <Panel
        title="Semaine du 26 mai au 1er juin"
        description="Glissez-déposez les shifts pour réorganiser."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.5rem",
            marginTop: "0.4rem",
          }}
        >
          {DAYS.map((day) => (
            <div
              key={day.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0.6rem 0.5rem",
                minHeight: 140,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: day.today ? "#818cf8" : "var(--muted)",
                  marginBottom: "0.4rem",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {day.label}
              </div>
              {day.shifts.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.4rem 0.55rem",
                    border: "1px solid",
                    borderRadius: 8,
                    fontSize: "0.74rem",
                    marginTop: "0.35rem",
                    ...shiftStyle[s.type],
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.78rem" }}>
                    {s.who}
                  </strong>
                  <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>
                    {s.info}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <section className="two-up">
        <Panel
          title="Demandes de congés"
          description="À valider ou refuser."
        >
          <div className="item-list">
            <article className="item-card">
              <div className="item-row">
                <h3>Julien — du 12 au 16 juin</h3>
                <span className="pill pending">En attente</span>
              </div>
              <p>5 jours · Motif: vacances familiales</p>
            </article>
            <article className="item-card">
              <div className="item-row">
                <h3>Marie — 8 juin</h3>
                <span className="pill pending">En attente</span>
              </div>
              <p>1 jour · Motif: rendez-vous médical</p>
            </article>
          </div>
        </Panel>

        <Panel
          title="Mes disponibilités juin"
          description="Coche les créneaux où tu es libre."
        >
          <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
            🟢 12 jours marqués disponibles<br />
            🔴 3 jours indisponibles<br />
            ⚪ 15 jours à confirmer
          </p>
          <button type="button" className="button" style={{ marginTop: "0.8rem" }}>
            Soumettre mes dispos
          </button>
        </Panel>
      </section>
    </main>
  );
}
