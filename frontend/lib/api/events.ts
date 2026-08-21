import { apiGet, getAccessToken } from "@/lib/api/client";
import {
  EventCancellationDetailResponse,
  EventCancellationsResponse,
} from "@/lib/api/contracts";
import {
  EventCancellationRegistration,
  EventCancellationSummary,
} from "@/lib/types";

export async function fetchCancelledEvents(): Promise<EventCancellationSummary[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<EventCancellationsResponse>("/hub/events/cancelled");
  return res.items || [];
}

export async function fetchEventCancellationDetail(
  eventId: string | number,
): Promise<{
  event: EventCancellationSummary;
  registrations: EventCancellationRegistration[];
} | null> {
  if (!getAccessToken()) return null;
  const res = await apiGet<EventCancellationDetailResponse>(
    `/hub/events/${eventId}/cancellation`,
  );
  return {
    event: res.event,
    registrations: res.items || [],
  };
}
