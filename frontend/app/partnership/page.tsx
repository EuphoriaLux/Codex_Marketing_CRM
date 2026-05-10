"use client";

import { FormEvent, useState } from "react";

type VenueType =
  | "rooftop"
  | "private-room"
  | "restaurant"
  | "lounge"
  | "atypical"
  | "outdoor"
  | "other";

type VenueDraft = {
  venueName: string;
  operatingCompany: string;
  website: string;
  venueType: VenueType;
  address: string;
  city: string;
  standingCapacity: string;
  seatedCapacity: string;
  surfaceM2: string;
  rentalCost: string;
  pricingNotes: string;
  availability: string;
  galleryUrl: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  message: string;
};

const initialDraft: VenueDraft = {
  venueName: "",
  operatingCompany: "",
  website: "",
  venueType: "private-room",
  address: "",
  city: "",
  standingCapacity: "",
  seatedCapacity: "",
  surfaceM2: "",
  rentalCost: "",
  pricingNotes: "",
  availability: "",
  galleryUrl: "",
  contactName: "",
  role: "",
  email: "",
  phone: "",
  message: "",
};

export default function PartnershipPage() {
  const [draft, setDraft] = useState<VenueDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  function update<K extends keyof VenueDraft>(key: K, value: VenueDraft[K]) {
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
        <p className="eyebrow">Proposer un lieu</p>
        <h1>Vous avez un lieu&nbsp;? Nous organisons les événements.</h1>
        <p className="public-hero-copy">
          Crush.lu organise toute l&apos;année des événements professionnels,
          lancements produits, soirées networking et activations culturelles au
          Luxembourg et en Grande Région. Pour chaque format, nous cherchons
          des lieux qui ont du caractère et la bonne capacité. Présentez-nous
          le vôtre&nbsp;: capacités, tarif de privatisation, ce qui est
          inclus — nous revenons vers vous pour planifier une visite.
        </p>
      </section>

      <section className="public-grid">
        <article className="public-card">
          <h2>Ce que nous cherchons</h2>
          <p>
            Salles privatives, rooftops, restaurants, lounges, espaces
            atypiques. Capacité de 50 à 500 personnes, privatisables en
            soirée ou en journée, accessibles depuis le centre-ville.
          </p>
        </article>
        <article className="public-card">
          <h2>Ce que nous apportons</h2>
          <p>
            Une audience qualifiée, un plan de communication complet
            (newsletter, social, presse), la prise en charge logistique de
            l&apos;événement et un calendrier de bookings récurrents si le
            lieu correspond.
          </p>
        </article>
        <article className="public-card">
          <h2>Comment ça marche</h2>
          <p>
            Vous remplissez ce formulaire, nous planifions une visite sous 1
            à 2 semaines, puis nous calons un premier événement test. Les
            lieux qui fonctionnent rentrent dans nos formats récurrents.
          </p>
        </article>
      </section>

      <section className="public-form-block">
        <header className="public-form-head">
          <h2>Présentez-nous votre lieu</h2>
          <p>
            Plus vous nous donnez d&apos;éléments concrets (capacité, tarif,
            ce qui est inclus), plus la première proposition sera précise.
          </p>
        </header>

        {submitted ? (
          <div className="public-success">
            <h3>Merci&nbsp;!</h3>
            <p>
              Votre lieu <strong>{draft.venueName}</strong> a bien été
              enregistré. Notre équipe vous recontacte à{" "}
              <strong>{draft.email}</strong> sous 3 jours ouvrés pour
              planifier une visite.
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={handleReset}
            >
              Soumettre un autre lieu
            </button>
          </div>
        ) : (
          <form className="app-form public-form" onSubmit={handleSubmit}>
            <h3 className="public-form-section">Le lieu</h3>
            <div className="public-form-row">
              <label>
                Nom du lieu
                <input
                  type="text"
                  required
                  value={draft.venueName}
                  onChange={(e) => update("venueName", e.target.value)}
                  placeholder="Rooftop des Bains, Salle Atrium..."
                />
              </label>
              <label>
                Société exploitante
                <input
                  type="text"
                  value={draft.operatingCompany}
                  onChange={(e) => update("operatingCompany", e.target.value)}
                  placeholder="Si différente du nom du lieu"
                />
              </label>
            </div>

            <div className="public-form-row">
              <label>
                Type de lieu
                <select
                  value={draft.venueType}
                  onChange={(e) =>
                    update("venueType", e.target.value as VenueType)
                  }
                >
                  <option value="private-room">Salle privative</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="lounge">Lounge / club</option>
                  <option value="atypical">Espace atypique</option>
                  <option value="outdoor">Extérieur / jardin</option>
                  <option value="other">Autre</option>
                </select>
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
                Adresse complète
                <input
                  type="text"
                  required
                  value={draft.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="N°, rue, code postal"
                />
              </label>
              <label>
                Ville / pays
                <input
                  type="text"
                  required
                  value={draft.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Luxembourg, LU"
                />
              </label>
            </div>

            <h3 className="public-form-section">Capacité</h3>
            <div className="public-form-row">
              <label>
                Places debout
                <input
                  type="number"
                  min="0"
                  required
                  value={draft.standingCapacity}
                  onChange={(e) =>
                    update("standingCapacity", e.target.value)
                  }
                  placeholder="Ex.: 150"
                />
              </label>
              <label>
                Places assises
                <input
                  type="number"
                  min="0"
                  required
                  value={draft.seatedCapacity}
                  onChange={(e) => update("seatedCapacity", e.target.value)}
                  placeholder="Ex.: 80"
                />
              </label>
            </div>

            <label>
              Surface (m²) — optionnel
              <input
                type="number"
                min="0"
                value={draft.surfaceM2}
                onChange={(e) => update("surfaceM2", e.target.value)}
                placeholder="Ex.: 220"
              />
            </label>

            <h3 className="public-form-section">Tarification</h3>
            <label>
              Coût de réservation
              <input
                type="text"
                required
                value={draft.rentalCost}
                onChange={(e) => update("rentalCost", e.target.value)}
                placeholder="Ex.: 3 500 € / soirée, 450 € / heure, sur devis..."
              />
            </label>

            <label>
              Ce qui est inclus dans le prix
              <textarea
                rows={3}
                value={draft.pricingNotes}
                onChange={(e) => update("pricingNotes", e.target.value)}
                placeholder="Mobilier, sono, lumières, écran, vestiaire, personnel, ménage de fin..."
              />
            </label>

            <h3 className="public-form-section">Disponibilités &amp; visuels</h3>
            <label>
              Disponibilités générales
              <textarea
                rows={3}
                value={draft.availability}
                onChange={(e) => update("availability", e.target.value)}
                placeholder="Jours fermés, créneaux préférés, périodes bloquées..."
              />
            </label>

            <label>
              Lien galerie / visite virtuelle
              <input
                type="url"
                value={draft.galleryUrl}
                onChange={(e) => update("galleryUrl", e.target.value)}
                placeholder="https:// (Google Drive, Matterport, site...)"
              />
            </label>

            <h3 className="public-form-section">Contact</h3>
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
                  placeholder="Gérant, responsable événementiel..."
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
                  placeholder="contact@lelieu.com"
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

            <label>
              Message
              <textarea
                rows={4}
                required
                value={draft.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Ce qui rend votre lieu unique, formats déjà accueillis, contraintes éventuelles..."
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
                recontacter au sujet de mon lieu.
              </span>
            </label>

            <button type="submit" className="button" disabled={!consent}>
              Envoyer ma proposition
            </button>
            <p className="form-note">
              Les données sont conservées localement pour la démo. Brancher
              <code> POST /hub/venues</code> côté backend pour la mise en
              production.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
