"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { fetchTeamMembers } from "@/lib/api/team";
import type { TeamMember } from "@/lib/types";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTeamMembers();
        if (mounted) {
          setMembers(data);
        }
      } catch (err) {
        if (mounted) {
          setError("Impossible de charger les membres de l'équipe.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="👥 Équipe & Roster"
        title="Membres et Coachs de Crush.lu."
        description="L'équipe au complet : statuts, rôles d'animation et historique d'événements."
      />

      {error ? (
        <div className="panel" style={{ color: "var(--danger)", padding: "1rem" }}>
          ⚠️ {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {loading ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "2rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Chargement des coachs et intervenants...
          </div>
        ) : members.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "2rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Aucun membre d'équipe enregistré ou session requise.
          </div>
        ) : (
          members.map((m, idx) => (
            <div
              key={`${m.name}-${idx}`}
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
                  background: m.gradient || "linear-gradient(135deg, #6366f1, #ec4899)",
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
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  marginTop: "0.15rem",
                }}
              >
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
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Events
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.presence}</div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Présence
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

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
          <strong>Ajouter un membre</strong>
          <div
            style={{
              color: "var(--muted)",
              fontSize: "0.82rem",
              marginTop: "0.15rem",
            }}
          >
            Staff & Coach · Crush.lu
          </div>
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: "0.9rem", width: "100%" }}
            onClick={() => {
              window.open("https://crush.lu/admin/crush_lu/crushcoach/add/", "_blank");
            }}
          >
            Configurer sur Django Admin ↗
          </button>
        </div>
      </div>
    </main>
  );
}
