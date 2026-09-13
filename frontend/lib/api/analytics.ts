import { apiGet } from "@/lib/api/client";
import type { AnalyticsOverviewResponse } from "@/lib/api/contracts";

export type AnalyticsPeriod = 7 | 28 | 90;

export function fetchAnalyticsOverview(
  days: AnalyticsPeriod,
): Promise<AnalyticsOverviewResponse> {
  return apiGet<AnalyticsOverviewResponse>(`/hub/analytics/overview?days=${days}`);
}
