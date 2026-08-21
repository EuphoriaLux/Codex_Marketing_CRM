import { apiGet, getAccessToken } from "@/lib/api/client";
import { TeamMembersResponse } from "@/lib/api/contracts";
import { TeamMember } from "@/lib/types";

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<TeamMembersResponse>("/hub/team");
  return res.items || [];
}
