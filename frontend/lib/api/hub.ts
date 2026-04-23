import { apiGet, getAccessToken } from "@/lib/api/client";
import {
  MeResponse,
  RequestsResponse,
  ResourcesResponse,
  TimelineResponse,
} from "@/lib/api/contracts";
import {
  customerSnapshot,
  requests,
  resources,
  timeline,
} from "@/lib/mock-data";
import {
  CustomerSnapshot,
  RequestItem,
  ResourceItem,
  TimelineEvent,
} from "@/lib/types";

export type HubDataSource = "api" | "mock";

export type HubPayload = {
  customer: CustomerSnapshot;
  requests: RequestItem[];
  resources: ResourceItem[];
  timeline: TimelineEvent[];
  source: HubDataSource;
};

export async function fetchHubData(): Promise<HubPayload> {
  if (!getAccessToken()) {
    return {
      customer: customerSnapshot,
      requests,
      resources,
      timeline,
      source: "mock",
    };
  }

  try {
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
      source: "api",
    };
  } catch {
    return {
      customer: customerSnapshot,
      requests,
      resources,
      timeline,
      source: "mock",
    };
  }
}
