import { apiDelete, apiGet, apiPatch, apiPost, getAccessToken } from "@/lib/api/client";
import {
  LocationsResponse,
  OfferEventDraftResponse,
  PartnerOffersResponse,
  PartnerOnboardingResponse,
} from "@/lib/api/contracts";
import {
  LocationItem,
  OfferEventDraft,
  OnboardingStep,
  PartnerOffer,
  PartnerLinkedEvent,
} from "@/lib/types";

const CRUSH_BASE_URL =
  process.env.NEXT_PUBLIC_CRUSH_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://crush.lu");

// --- Partners (Locations) ---

export async function fetchLocations(): Promise<LocationItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<LocationsResponse>("/hub/locations");
  return res.items || [];
}

export async function fetchLocation(id: string | number): Promise<LocationItem> {
  return apiGet<LocationItem>(`/hub/locations/${id}`);
}

export async function fetchPartnerEvents(id: string): Promise<PartnerLinkedEvent[]> {
  const result = await apiGet<{ items: PartnerLinkedEvent[] }>(`/hub/locations/${id}/events`);
  return result.items;
}

export function fetchEventPartnerLink(id: string): Promise<PartnerLinkedEvent> {
  return apiGet<PartnerLinkedEvent>(`/hub/events/${id}/partner-link`);
}

export function linkEventPartner(
  id: string,
  partnerId: string,
  offerId: string | null,
): Promise<PartnerLinkedEvent> {
  return apiPatch<PartnerLinkedEvent>(`/hub/events/${id}/partner-link`, { partnerId, offerId });
}

export function buildEventAdminUrl(id: string): string {
  return `${CRUSH_BASE_URL.replace(/\/+$/, "")}/crush-admin/crush_lu/meetupevent/${encodeURIComponent(id)}/change/`;
}

export async function createLocation(
  data: Partial<LocationItem>,
): Promise<LocationItem> {
  return apiPost<LocationItem>("/hub/locations", data);
}

export async function updateLocation(
  id: string | number,
  data: Partial<LocationItem>,
): Promise<LocationItem> {
  return apiPatch<LocationItem>(`/hub/locations/${id}`, data);
}

export async function deleteLocation(id: string | number): Promise<void> {
  return apiDelete<void>(`/hub/locations/${id}`);
}

// --- Partner Offers ---

export async function fetchOffers(
  locationId: string | number,
): Promise<PartnerOffer[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<PartnerOffersResponse>(
    `/hub/locations/${locationId}/offers`,
  );
  return res.items || [];
}

export async function fetchOffer(
  locationId: string | number,
  offerId: string | number,
): Promise<PartnerOffer> {
  return apiGet<PartnerOffer>(
    `/hub/locations/${locationId}/offers/${offerId}`,
  );
}

export async function createOffer(
  locationId: string | number,
  data: Partial<PartnerOffer>,
): Promise<PartnerOffer> {
  return apiPost<PartnerOffer>(
    `/hub/locations/${locationId}/offers`,
    data,
  );
}

export async function updateOffer(
  locationId: string | number,
  offerId: string | number,
  data: Partial<PartnerOffer>,
): Promise<PartnerOffer> {
  return apiPatch<PartnerOffer>(
    `/hub/locations/${locationId}/offers/${offerId}`,
    data,
  );
}

export async function deleteOffer(
  locationId: string | number,
  offerId: string | number,
): Promise<void> {
  return apiDelete<void>(
    `/hub/locations/${locationId}/offers/${offerId}`,
  );
}

// --- Onboarding Checklist ---

export async function fetchOnboarding(
  locationId: string | number,
): Promise<OnboardingStep[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<PartnerOnboardingResponse>(
    `/hub/locations/${locationId}/onboarding`,
  );
  return res.items || [];
}

export async function updateOnboarding(
  locationId: string | number,
  steps: { key: string; done?: boolean; notes?: string }[],
): Promise<OnboardingStep[]> {
  const res = await apiPatch<PartnerOnboardingResponse>(
    `/hub/locations/${locationId}/onboarding`,
    { steps },
  );
  return res.items || [];
}

// --- Event Draft & Coach Integration ---

export async function fetchOfferEventDraft(
  offerId: string | number,
): Promise<OfferEventDraft> {
  return apiGet<OfferEventDraftResponse>(`/hub/offers/${offerId}/event-draft`);
}

/**
 * Opens the event form using the current server-side offer preset.
 */
export function buildCoachEventUrl(draft: OfferEventDraft): string {
  const base = CRUSH_BASE_URL.replace(/\/+$/, "");
  const params = new URLSearchParams({ offer_id: String(draft.offerId) });
  // Django resolves the preset from the offer ID and persists both relationships.
  return `${base}/crush-admin/crush_lu/meetupevent/add/?${params.toString()}`;
}
