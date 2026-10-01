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
 * Generates the URL to open the Coach Event form on Crush.lu with the prefilled
 * fields from the event draft.
 */
export function buildCoachEventUrl(draft: OfferEventDraft): string {
  const base = CRUSH_BASE_URL.replace(/\/+$/, "");
  const params = new URLSearchParams();

  params.set("offer_id", String(draft.offerId));
  params.set("partner_id", String(draft.partnerId));

  const f = draft.fields;
  if (f.event_type) params.set("event_type", f.event_type);
  if (f.location) params.set("location", f.location);
  if (f.address_street) params.set("address_street", f.address_street);
  if (f.address_number) params.set("address_number", f.address_number);
  if (f.address_postcode) params.set("address_postcode", f.address_postcode);
  if (f.address_town) params.set("address_town", f.address_town);
  if (f.canton) params.set("canton", f.canton);
  if (f.duration_minutes) params.set("duration_minutes", String(f.duration_minutes));
  if (f.max_participants) params.set("max_participants", String(f.max_participants));
  if (f.max_participants_m !== null && f.max_participants_m !== undefined) {
    params.set("max_participants_m", String(f.max_participants_m));
  }
  if (f.max_participants_f !== null && f.max_participants_f !== undefined) {
    params.set("max_participants_f", String(f.max_participants_f));
  }
  if (f.registration_fee !== undefined) {
    params.set("registration_fee", String(f.registration_fee));
  }
  if (f.title_fr) params.set("title_fr", f.title_fr);
  if (f.title_en) params.set("title_en", f.title_en);
  if (draft.suggestedStartTime) params.set("suggested_start_time", draft.suggestedStartTime);

  // Link to the coach events add page or admin meetupevent add form
  return `${base}/admin/crush_lu/meetupevent/add/?${params.toString()}`;
}
