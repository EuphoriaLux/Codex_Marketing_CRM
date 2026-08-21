import { apiGet, getAccessToken } from "@/lib/api/client";
import { LocationsResponse } from "@/lib/api/contracts";
import { LocationItem } from "@/lib/types";

export async function fetchLocations(): Promise<LocationItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<LocationsResponse>("/hub/locations");
  return res.items || [];
}
