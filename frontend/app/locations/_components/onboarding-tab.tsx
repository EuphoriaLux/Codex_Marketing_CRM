"use client";

import { useEffect, useRef, useState } from "react";
import { fetchOnboarding, updateOnboarding } from "@/lib/api/locations";
import { ONBOARDING_STEPS_CONFIG } from "@/lib/constants/partners";
import type { LocationItem, OnboardingStep } from "@/lib/types";

type Props = {
  partner: LocationItem;
  onProgressUpdated?: (doneCount: number, totalCount: number) => void;
};

export function OnboardingTab({ partner, onProgressUpdated }: Props) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotesKey, setEditingNotesKey] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const onProgressUpdatedRef = useRef(onProgressUpdated);
  useEffect(() => {
    onProgressUpdatedRef.current = onProgressUpdated;
  }, [onProgressUpdated]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOnboarding(partner.id);
        if (mounted) {
          setSteps(data);
          const done = data.filter((s) => s.done).length;
          onProgressUpdatedRef.current?.(done, data.length);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement de la checklist.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [partner.id]);

  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length || ONBOARDING_STEPS_CONFIG.length;
  const percentage = Math.round((doneCount / (totalCount || 1)) * 100);
  const hasIncompleteSteps = doneCount < totalCount;
  const isActive = partner.partnershipStage === "Active";

  async function handleToggle(step: OnboardingStep) {
    try {
      setUpdatingKey(step.key);
      const nextDone = !step.done;
      const updated = await updateOnboarding(partner.id, [
        { key: step.key, done: nextDone },
      ]);
      setSteps(updated);
      const nextDoneCount = updated.filter((s) => s.done).length;
      onProgressUpdated?.(nextDoneCount, updated.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour l'étape.");
    } finally {
      setUpdatingKey(null);
    }
  }

  async function handleSaveNotes(stepKey: string) {
    try {
      setUpdatingKey(stepKey);
      const updated = await updateOnboarding(partner.id, [
        { key: stepKey, notes: tempNotes.trim() },
      ]);
      setSteps(updated);
      setEditingNotesKey(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder la note.");
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <div className="onboarding-tab-container">
      {isActive && hasIncompleteSteps && (
        <div className="status-banner warning" style={{ marginBottom: "1.2rem" }}>
          ⚠️ <strong>Avertissement :</strong> Ce partenaire est marqué comme <strong>Actif</strong>,
          mais sa checklist d'onboarding n'est pas encore finalisée ({doneCount}/{totalCount} étapes).
          Pensez à compléter les prérequis (photos, règlement, test) pour garantir la qualité opérationnelle.
        </div>
      )}

      {error && (
        <div className="status-banner" style={{ marginBottom: "1.2rem", color: "var(--danger)" }}>
          ⚠️ {error}
        </div>
      )}

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Progression de l'onboarding</h3>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              Validation des 8 jalons clés avant et pendant la collaboration.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: 800 }}>
              {doneCount} / {totalCount}
            </span>
            <span style={{ marginLeft: "0.4rem", color: "var(--muted)", fontSize: "0.88rem" }}>
              ({percentage}%)
            </span>
          </div>
        </div>

        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentage}%`,
              background: percentage === 100 ? "#10b981" : "var(--accent)",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          Chargement de la checklist...
        </div>
      ) : (
        <div className="checklist-grid">
          {steps.map((step, idx) => {
            const config = ONBOARDING_STEPS_CONFIG.find((c) => c.key === step.key);
            const isEditingNotes = editingNotesKey === step.key;
            const isUpdating = updatingKey === step.key;

            return (
              <div
                key={step.key}
                className={`checklist-item${step.done ? " done" : ""}`}
              >
                <div className="checklist-item-header">
                  <label className="checklist-toggle">
                    <input
                      type="checkbox"
                      checked={step.done}
                      disabled={isUpdating}
                      onChange={() => handleToggle(step)}
                    />
                    <span className="checklist-number">{idx + 1}</span>
                    <div className="checklist-titles">
                      <strong>{step.label || config?.label || step.key}</strong>
                      <span className="checklist-desc">
                        {config?.description}
                      </span>
                    </div>
                  </label>

                  <div className="checklist-meta">
                    {step.done ? (
                      <span className="checklist-badge done">
                        ✓ Fait {step.doneAt ? `le ${new Date(step.doneAt).toLocaleDateString("fr-FR")}` : ""}
                        {step.doneBy ? ` par ${step.doneBy}` : ""}
                      </span>
                    ) : (
                      <span className="checklist-badge pending">À faire</span>
                    )}
                  </div>
                </div>

                <div className="checklist-item-body">
                  {isEditingNotes ? (
                    <div className="checklist-notes-edit">
                      <textarea
                        rows={2}
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Ajouter une note ou un détail de suivi..."
                        className="form-textarea"
                      />
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                        <button
                          type="button"
                          className="button"
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                          onClick={() => handleSaveNotes(step.key)}
                          disabled={isUpdating}
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                          onClick={() => setEditingNotesKey(null)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="checklist-notes-view">
                      {step.notes ? (
                        <p className="checklist-notes-text">
                          💬 <em>{step.notes}</em>
                        </p>
                      ) : (
                        <span className="checklist-notes-empty">Aucune note</span>
                      )}
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setTempNotes(step.notes || "");
                          setEditingNotesKey(step.key);
                        }}
                      >
                        {step.notes ? "Modifier la note" : "+ Ajouter une note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
