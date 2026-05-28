import { apiGet, getAccessToken } from "@/lib/api/client";
import {
  MeResponse,
  RequestsResponse,
  ResourcesResponse,
  TimelineResponse,
} from "@/lib/api/contracts";
import {
  CustomerSnapshot,
  RequestItem,
  ResourceItem,
  TimelineEvent,
} from "@/lib/types";

export type HubPayload = {
  customer: CustomerSnapshot;
  requests: RequestItem[];
  resources: ResourceItem[];
  timeline: TimelineEvent[];
};

export async function fetchHubData(): Promise<HubPayload | null> {
  if (!getAccessToken()) {
    return null;
  }

  const [meResponse, requestsResponse, resourcesResponse, timelineResponse] =
    await Promise.all([
      apiGet<MeResponse>("/hub/me"),
      apiGet<RequestsResponse>("/hub/requests"),
      apiGet<ResourcesResponse>("/hub/resources"),
      apiGet<TimelineResponse>("/hub/timeline"),
    ]);

  return {
    customer: meResponse.customer,
    requests: requestsResponse.items,
    resources: resourcesResponse.items,
    timeline: timelineResponse.items,
  };
}
