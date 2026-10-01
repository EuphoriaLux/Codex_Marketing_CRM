"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { StatusBanner } from "@/components/status-banner";
import { fetchLocation, fetchOffers } from "@/lib/api/locations";
import type { LocationItem, PartnerOffer } from "@/lib/types";
import { EventDraftModal } from "../_components/event-draft-modal";
import { LinkedEventsTab } from "../_components/linked-events-tab";
import { OffersTab } from "../_components/offers-tab";
import { OnboardingTab } from "../_components/onboarding-tab";
import { PartnerHeader } from "../_components/partner-header";
import { PartnerInfoTab } from "../_components/partner-info-tab";

type TabKey = "info" | "offers" | "onboarding" | "events";

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={<DetailLoadingSkeleton />}>
      <PartnerDetailContent />
    </Suspense>
  );
}

function DetailLoadingSkeleton() {
  return (
    <main className="page">
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
        Chargement des informations du partenaire...
      </div>
    </main>
  );
}

function PartnerDetailContent() {
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id");
  const tabParam = searchParams.get("tab") as TabKey | null;

  const [partner, setPartner] = useState<LocationItem | null>(null);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick event draft trigger from linked events
  const [activeDraft, setActiveDraft] = useState<import("@/lib/types").OfferEventDraft | null>(null);
  const [draftOfferName, setDraftOfferName] = useState("");

  const handleOffersCountUpdated = useCallback((count: number) => {
    setOffers((prev) => (prev.length !== count ? [...prev] : prev));
    setPartner((prev) =>
      prev && prev.offerCount !== count ? { ...prev, offerCount: count } : prev,
    );
  }, []);

  const handleProgressUpdated = useCallback((done: number, total: number) => {
    setPartner((prev) => {
      if (!prev) return prev;
      if (
        prev.onboardingProgress?.done === done &&
        prev.onboardingProgress?.total === total
      ) {
        return prev;
      }
      return { ...prev, onboardingProgress: { done, total } };
    });
  }, []);

  useEffect(() => {
    if (!partnerId) {
      setError("Identifiant de partenaire manquant dans l'URL.");
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [locData, offersData] = await Promise.all([
          fetchLocation(partnerId as string),
          fetchOffers(partnerId as string).catch(() => []),
        ]);
        if (mounted) {
          setPartner(locData);
          setOffers(offersData);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger la fiche du partenaire.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadData();
    return () => {
      mounted = false;
    };
  }, [partnerId]);

  if (loading) {
    return (
      <main className="page">
        <StatusBanner />
        <DetailLoadingSkeleton />
      </main>
    );
  }

  if (error || !partner) {
    return (
      <main className="page">
        <StatusBanner />
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <h2 style={{ color: "var(--danger)", margin: "0 0 1rem" }}>⚠️ {error || "Partenaire introuvable"}</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
            Vérifiez l'identifiant du partenaire ou retournez au répertoire.
          </p>
          <Link href="/locations" className="button">
            ← Retour aux partenaires
          </Link>
        </div>
      </main>
    );
  }

  const offersCount = offers.length || partner.offerCount || 0;
  const onboardingDone = partner.onboardingProgress?.done || 0;
  const onboardingTotal = partner.onboardingProgress?.total || 8;

  return (
    <main className="page">
      <StatusBanner />

      <PartnerHeader
        partner={partner}
        offersCount={offersCount}
        onboardingDone={onboardingDone}
        onboardingTotal={onboardingTotal}
        onPartnerUpdated={(updated) => setPartner(updated)}
      />

      {/* TABS NAVIGATION */}
      <div className="partner-tabs-nav">
        <button
          type="button"
          className={`partner-tab-button${activeTab === "info" ? " active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          <span>📋 Fiche & Contacts</span>
        </button>

        <button
          type="button"
          className={`partner-tab-button${activeTab === "offers" ? " active" : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          <span>🎟️ Offres d'événements</span>
          <span className="tab-counter-badge">{offersCount}</span>
        </button>

        <button
          type="button"
          className={`partner-tab-button${activeTab === "onboarding" ? " active" : ""}`}
          onClick={() => setActiveTab("onboarding")}
        >
          <span>✅ Checklist Onboarding</span>
          <span className="tab-counter-badge">
            {onboardingDone}/{onboardingTotal}
          </span>
        </button>

        <button
          type="button"
          className={`partner-tab-button${activeTab === "events" ? " active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <span>🗓️ Événements liés</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="partner-tab-content">
        {activeTab === "info" && (
          <PartnerInfoTab
            partner={partner}
            onPartnerUpdated={(updated) => setPartner(updated)}
          />
        )}

        {activeTab === "offers" && (
          <OffersTab
            partner={partner}
            onOffersCountUpdated={handleOffersCountUpdated}
          />
        )}

        {activeTab === "onboarding" && (
          <OnboardingTab
            partner={partner}
            onProgressUpdated={handleProgressUpdated}
          />
        )}

        {activeTab === "events" && (
          <LinkedEventsTab
            partner={partner}
            offers={offers}
            onCreateEventFromOffer={async (offer) => {
              try {
                const { fetchOfferEventDraft } = await import("@/lib/api/locations");
                const draft = await fetchOfferEventDraft(offer.id);
                setActiveDraft(draft);
                setDraftOfferName(offer.name);
              } catch {
                alert("Impossible de charger le projet d'événement.");
              }
            }}
          />
        )}
      </div>

      {activeDraft && (
        <EventDraftModal
          draft={activeDraft}
          offerName={draftOfferName}
          onClose={() => setActiveDraft(null)}
        />
      )}
    </main>
  );
}
