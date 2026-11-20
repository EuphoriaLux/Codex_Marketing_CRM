import { apiGet, apiPatch, getAccessToken } from "@/lib/api/client";
import { MeResponse } from "@/lib/api/contracts";
import { CustomerSnapshot } from "@/lib/types";

export type HubPayload = {
  customer: CustomerSnapshot;
};

// Session context shared by every page: who is signed in. Domain data
// (events, partners, finance, …) is fetched by each page on its own.
export async function fetchHubData(): Promise<HubPayload | null> {
  if (!getAccessToken()) {
    return null;
  }

  const meResponse = await apiGet<MeResponse>("/hub/me");
  return { customer: meResponse.customer };
}

// PATCH /hub/me — updates the signed-in staff member's profile.
export async function updateProfile(
  customer: Partial<CustomerSnapshot>,
): Promise<CustomerSnapshot> {
  const res = await apiPatch<MeResponse>("/hub/me", { customer });
  return res.customer;
}
