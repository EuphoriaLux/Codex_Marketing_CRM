export type Metric = {
  label: string;
  value: string;
};

export type RequestItem = {
  id: string;
  subject: string;
  category: "Project" | "Technical" | "Billing" | "General";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Review" | "Waiting for Client" | "Closed";
  summary: string;
};

export type ResourceItem = {
  id: string;
  title: string;
  type: "Guide" | "Report" | "Asset" | "Invoice";
  summary: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type CustomerSnapshot = {
  organization: string;
  primaryContact: string;
  email: string;
  phone: string;
};
