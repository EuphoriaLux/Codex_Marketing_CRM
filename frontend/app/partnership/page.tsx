"use client";

import { FormEvent, useState } from "react";

type PartnershipKind =
  | "sponsoring"
  | "co-host"
  | "media"
  | "in-kind"
  | "other";

type EventInterest =
  | "corporate"
  | "launch"
  | "networking"
  | "cultural"
  | "any";

type PartnershipDraft = {
  company: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  partnershipKind: PartnershipKind;
  eventInterest: EventInterest;
  budget: string;
  message: string;
};

const initialDraft: PartnershipDraft = {
  company: "",
  contactName: "",
  role: "",
  email: "",
  phone: "",
  website: "",
  partnershipKind: "sponsoring",
  eventInterest: "any",
  budget: "",
  message: "",
};

export default function PartnershipPage() {
  const [draft, setDraft] = useState<PartnershipDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  function update<K extends keyof PartnershipDraft>(
    key: K,
    value: PartnershipDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;
    setSubmitted(true);
  }

  function handleReset() {
    setDraft(initialDraft);
    setConsent(false);
    setSubmitted(false);
  }

  return (
    <div className="public-page">
      <section className="public-hero">
        <p className="eyebrow">Partenariats événementiels</p>
        <h1>Associez votre marque à nos événements.</h1>
        <p className="public-hero-copy">
          Tout au long de l&apos;année, Crush.lu organise des événements
          professionnels, lancements produits, soirées networking et activations
          culturelles au Luxembourg et en Grande Région. Si votre société
          souhaite devenir partenaire, sponsor ou co-organisateur,
          parlons-en&nbsp;: chaque collaboration est construite sur mesure
          autour de vos objectifs.
        </p>
      </section>

      <section className="public-grid">
        <article className="public-card">
          <h2>Sponsoring</h2>
          <p>
            Visibilité sur la communication, présence sur place et activation
            de votre marque auprès d&apos;une audience qualifiée.
          </p>
        </article>
        <article className="public-card">
          <h2>Co-organisation</h2>
          <p>
            Construisons ensemble un format dédié&nbsp;: conférence, soirée
            privée, atelier ou événement hybride aligné sur votre cible.
          </p>
        </article>
        <article className="public-card">
          <h2>Échange de services</h2>
          <p>
            Lieux, traiteurs, agences créatives, studios&nbsp;: nous travaillons
            volontiers sous forme d&apos;échange ou de partenariat in-kind.
          </p>
        </article>
      </section>

      <section className="public-form-block">
        <header className="public-form-head">
          <h2>Parlez-nous de votre projet</h2>
          <p>
            Remplissez ce formulaire&nbsp;: notre équipe partenariats revient
            vers vous sous 3 jours ouvrés avec une première proposition.
          </p>
        </header>

        {submitted ? (
          <div className="public-success">
            <h3>Merci&nbsp;!</h3>
            <p>
              Votre demande de partenariat a bien été enregistrée. Nous vous
              recontacterons à <strong>{draft.email}</strong> rapidement.
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={handleReset}
            >
              Envoyer une nouvelle demande
            </button>
          </div>
        ) : (
          <form className="app-form public-form" onSubmit={handleSubmit}>
            <div className="public-form-row">
              <label>
                Société
                <input
                  type="text"
                  required
                  value={draft.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Nom de votre entreprise"
                />
              </label>
              <label>
                Site web
                <input
                  type="url"
                  value={draft.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://"
                />
              </label>
            </div>

            <div className="public-form-row">
              <label>
                Personne de contact
                <input
                  type="text"
                  required
                  value={draft.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                  placeholder="Prénom et nom"
                />
              </label>
              <label>
                Fonction
                <input
                  type="text"
                  value={draft.role}
                  onChange={(e) => update("role", e.target.value)}
                  placeholder="Directrice marketing, CEO..."
                />
              </label>
            </div>

            <div className="public-form-row">
              <label>
                Email professionnel
                <input
                  type="email"
                  required
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="contact@entreprise.com"
                />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+352 ..."
                />
              </label>
            </div>

            <div className="public-form-row">
              <label>
                Type de partenariat
                <select
                  value={draft.partnershipKind}
                  onChange={(e) =>
                    update(
                      "partnershipKind",
                      e.target.value as PartnershipKind,
                    )
                  }
                >
                  <option value="sponsoring">Sponsoring</option>
                  <option value="co-host">Co-organisation</option>
                  <option value="media">Partenariat média</option>
                  <option value="in-kind">Échange de services</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label>
                Type d&apos;événement
                <select
                  value={draft.eventInterest}
                  onChange={(e) =>
                    update("eventInterest", e.target.value as EventInterest)
                  }
                >
                  <option value="any">Indifférent</option>
                  <option value="corporate">Événement corporate</option>
                  <option value="launch">Lancement produit</option>
                  <option value="networking">Soirée networking</option>
                  <option value="cultural">Événement culturel</option>
                </select>
              </label>
            </div>

            <label>
              Budget indicatif (optionnel)
              <input
                type="text"
                value={draft.budget}
                onChange={(e) => update("budget", e.target.value)}
                placeholder="Ex.: 5 000 € — 15 000 €"
              />
            </label>

            <label>
              Votre message
              <textarea
                rows={5}
                required
                value={draft.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Présentez votre société, vos objectifs et le type de collaboration recherchée."
              />
            </label>

            <label className="public-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                J&apos;accepte que Crush.lu utilise ces informations pour me
                recontacter au sujet de ma demande de partenariat.
              </span>
            </label>

            <button type="submit" className="button" disabled={!consent}>
              Envoyer ma demande
            </button>
            <p className="form-note">
              Les données sont conservées localement pour la démo. Brancher
              <code> POST /hub/partnerships</code> côté backend pour la mise en
              production.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
