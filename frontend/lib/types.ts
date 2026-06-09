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

export type NewsCategory =
  | "Update"
  | "Feature"
  | "Meeting"
  | "Announcement";

export type NewsItem = {
  id: string;
  date: string;
  category: NewsCategory;
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

export type PaymentMethod = "Card" | "Transfer" | "Cash" | "Payconiq";

export type PaymentInItem = {
  id: string;
  date: string;
  amount: number;
  source: string;
  clientName?: string;
  status: PaymentStatus;
  reference?: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
};

export type PaymentOutCategory =
  | "Lieu"
  | "Marketing"
  | "Tech"
  | "Fournitures"
  | "Autre";

export type DepositStatus = "deposit" | "balance" | "full";

export type PaymentOutItem = {
  id: string;
  date: string;
  amount: number;
  locationId?: string;
  payee: string;
  description: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  category: PaymentOutCategory;
  depositStatus?: DepositStatus;
  receiptUrl?: string;
};

export type PayrollItem = {
  id: string;
  date: string;
  amount: number;
  grossSalary: number;
  employerCharges: number;
  employeeName: string;
  category: "Salary" | "Expense" | "Bonus";
  description: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
};

export type RefundItem = {
  id: string;
  date: string;
  amount: number;
  participantName: string;
  eventName: string;
  reason: string;
  status: PaymentStatus;
};

export type EventProfitability = {
  id: string;
  eventName: string;
  eventDate: string;
  ticketRevenue: number;
  venueCost: number;
  suppliesCost: number;
  otherCosts: number;
  refunds: number;
};

export type WhatsAppTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  example?: { body_text?: string[][]; header_text?: string[] };
};

export type WhatsAppTemplate = {
  name: string;
  language: string;
  category: string;
  status: string;
  components: WhatsAppTemplateComponent[];
};

export type WhatsAppMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppStatusEvent = {
  status: WhatsAppMessageStatus;
  timestamp: string;
  error_code?: number;
  error_message?: string;
};

export type WhatsAppMessage = {
  id: string;
  wa_message_id: string | null;
  recipient: string;
  template_name: string;
  language: string;
  parameters: Record<string, string>;
  status: WhatsAppMessageStatus;
  status_history: WhatsAppStatusEvent[];
  created_at: string;
};
