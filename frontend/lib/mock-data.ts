import { CustomerSnapshot, Metric, RequestItem, ResourceItem, TimelineEvent } from "@/lib/types";

export const customerSnapshot: CustomerSnapshot = {
  organization: "Crush Client Group",
  primaryContact: "Lina Weber",
  email: "lina@clientgroup.example",
  phone: "+352 621 000 422",
};

export const metrics: Metric[] = [
  { label: "Active requests", value: "04" },
  { label: "Shared resources", value: "12" },
  { label: "Pending approvals", value: "02" },
  { label: "Last response time", value: "3h" },
];

export const requests: RequestItem[] = [
  {
    id: "req-1",
    subject: "Spring campaign landing page",
    category: "Project",
    priority: "High",
    status: "In Review",
    summary: "Design and content changes are being reviewed before implementation.",
  },
  {
    id: "req-2",
    subject: "Analytics access for marketing lead",
    category: "Technical",
    priority: "Medium",
    status: "Open",
    summary: "A new stakeholder needs dashboard access and monthly exports.",
  },
  {
    id: "req-3",
    subject: "April invoice clarification",
    category: "Billing",
    priority: "Low",
    status: "Waiting for Client",
    summary: "Team is waiting on confirmation for the final campaign scope split.",
  },
  {
    id: "req-4",
    subject: "Brand asset refresh",
    category: "General",
    priority: "Medium",
    status: "Closed",
    summary: "Updated exports and delivery package were shared with the client team.",
  },
];

export const resources: ResourceItem[] = [
  {
    id: "res-1",
    title: "Campaign onboarding guide",
    type: "Guide",
    summary: "Reference workflow for approvals, timelines, and deliverables.",
    updatedAt: "18 Apr 2026",
  },
  {
    id: "res-2",
    title: "Q2 performance readout",
    type: "Report",
    summary: "Snapshot of traffic, conversion, and channel-level activity.",
    updatedAt: "15 Apr 2026",
  },
  {
    id: "res-3",
    title: "Brand asset master pack",
    type: "Asset",
    summary: "Approved logos, campaign images, and social templates.",
    updatedAt: "12 Apr 2026",
  },
];

export const timeline: TimelineEvent[] = [
  {
    id: "evt-1",
    date: "21 Apr",
    title: "Support request updated",
    description: "The landing page change request moved into review with the design team.",
  },
  {
    id: "evt-2",
    date: "19 Apr",
    title: "Resource uploaded",
    description: "The Q2 readout deck was added to the shared resource center.",
  },
  {
    id: "evt-3",
    date: "16 Apr",
    title: "Account note added",
    description: "Primary contact preferences were refreshed for campaign approvals.",
  },
];
