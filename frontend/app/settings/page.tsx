"use client";

import { FormEvent, useEffect, useState } from "react";
import { Panel } from "@/components/panel";
import { SectionHeader } from "@/components/section-header";
import { StatusBanner } from "@/components/status-banner";
import { updateProfile } from "@/lib/api/hub";
import { useHubData } from "@/lib/hub-provider";
import type { CustomerSnapshot } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const { customer, setCustomer, loading } = useHubData();
  const [form, setForm] = useState<CustomerSnapshot>(customer);
  const [state, setState] = useState<SaveState>("idle");

  // The session loads after first render; take its values once they arrive.
  useEffect(() => {
    setForm(customer);
  }, [customer]);

  const dirty =
    form.primaryContact !== customer.primaryContact ||
    form.organization !== customer.organization ||
    form.email !== customer.email ||
    form.phone !== customer.phone;

  function field(key: keyof CustomerSnapshot) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setState("idle");
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    try {
      const saved = await updateProfile(form);
      setCustomer(saved);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="page">
      <StatusBanner />
      <SectionHeader
        eyebrow="Compte"
        title="Mon profil"
        description="Le nom et le contact affichés dans le hub, enregistrés sur votre compte Crush.lu."
      />

      <Panel title="Coordonnées" description="Le nom apparaît dans la barre du haut et sur vos disponibilités coach.">
        <form className="app-form settings-form" onSubmit={handleSubmit}>
          <label>
            Nom affiché
            <input type="text" autoComplete="name" disabled={loading} {...field("primaryContact")} />
          </label>
          <label>
            Rôle ou organisation
            <input type="text" placeholder="ex. Coach, Crush.lu" disabled={loading} {...field("organization")} />
          </label>
          <label>
            E-mail
            <input type="email" autoComplete="email" disabled={loading} {...field("email")} />
          </label>
          <label>
            Téléphone
            <input type="tel" autoComplete="tel" disabled={loading} {...field("phone")} />
          </label>
          <div className="settings-actions">
            <button type="submit" className="button" disabled={!dirty || state === "saving"}>
              {state === "saving" ? "Enregistrement…" : "Enregistrer"}
            </button>
            <span role="status" className={`settings-feedback is-${state}`}>
              {state === "saved"
                ? "Profil enregistré."
                : state === "error"
                  ? "Échec de l'enregistrement. Réessayez."
                  : ""}
            </span>
          </div>
        </form>
      </Panel>
    </main>
  );
}
