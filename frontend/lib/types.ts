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

export type CrushEventType =
  | "Cooking workshop"
  | "Wine tasting"
  | "Speed dating"
  | "Outdoor activity"
  | "Quiz night";

export type PartnershipStage =
  | "Prospect"
  | "Negotiating"
  | "Active"
  | "Paused"
  | "Archived";

export type LocationContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

export type LocationItem = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;

  maxCapacity: number;
  seatedCapacity?: number;
  hasOutdoorSpace: boolean;
  hasKitchen: boolean;
  hasPrivateRoom: boolean;
  hasSoundSystem: boolean;

  compatibleEventTypes: CrushEventType[];

  partnershipStage: PartnershipStage;
  primaryContact: LocationContact;
  accountManager: string;
  commercialTerms?: string;
  partnerSince?: string;

  lastContactDate: string;
  nextAction?: string;
  nextActionDate?: string;
  notes: string;
  tags: string[];
};

export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Scheduled";

export type PaymentInItem = {
  id: string;
  date: string;
  amount: number;
  source: string;
  clientName?: string;
  status: PaymentStatus;
  reference?: string;
};

export type PaymentOutItem = {
  id: string;
  date: string;
  amount: number;
  locationId?: string;
  payee: string;
  description: string;
  status: PaymentStatus;
};

export type PayrollItem = {
  id: string;
  date: string;
  amount: number;
  employeeName: string;
  category: "Salary" | "Expense" | "Bonus";
  description: string;
  status: PaymentStatus;
};
