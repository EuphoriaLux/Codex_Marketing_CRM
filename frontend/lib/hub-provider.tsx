"use client";

import type { ReactNode } from "react";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchHubData } from "@/lib/api/hub";
import {
  CustomerSnapshot,
  EventProfitability,
  LocationItem,
  Metric,
  PaymentInItem,
  PaymentOutItem,
  PayrollItem,
  RefundItem,
  RequestItem,
  ResourceItem,
  TimelineEvent,
} from "@/lib/types";

type HubState = {
  customer: CustomerSnapshot;
  requests: RequestItem[];
  resources: ResourceItem[];
  timeline: TimelineEvent[];
  locations: LocationItem[];
  paymentsIn: PaymentInItem[];
  paymentsOut: PaymentOutItem[];
  payroll: PayrollItem[];
  refunds: RefundItem[];
  eventProfitability: EventProfitability[];
  metrics: Metric[];
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const emptyCustomer: CustomerSnapshot = {
  organization: "",
  primaryContact: "",
  email: "",
  phone: "",
};

const HubContext = createContext<HubState | null>(null);

function deriveMetrics(requests: RequestItem[], resources: ResourceItem[]): Metric[] {
  const activeRequests = requests.filter((item) => item.status !== "Closed").length;
  const waitingRequests = requests.filter(
    (item) => item.status === "Waiting for Client",
  ).length;
  const highPriority = requests.filter((item) => item.priority === "High").length;

  return [
    { label: "Active requests", value: String(activeRequests).padStart(2, "0") },
    { label: "Shared resources", value: String(resources.length).padStart(2, "0") },
    { label: "Waiting on client", value: String(waitingRequests).padStart(2, "0") },
    { label: "High priority", value: String(highPriority).padStart(2, "0") },
  ];
}

export function HubProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSnapshot>(emptyCustomer);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHubData();

      startTransition(() => {
        if (data) {
          setCustomer(data.customer);
          setRequests(data.requests);
          setResources(data.resources);
          setTimeline(data.timeline);
          setAuthenticated(true);
        } else {
          setCustomer(emptyCustomer);
          setRequests([]);
          setResources([]);
          setTimeline([]);
          setAuthenticated(false);
        }
      });
    } catch {
      setError("Unable to load hub data.");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <HubContext.Provider
      value={{
        customer,
        requests,
        resources,
        timeline,
        locations: [],
        paymentsIn: [],
        paymentsOut: [],
        payroll: [],
        refunds: [],
        eventProfitability: [],
        metrics: deriveMetrics(requests, resources),
        authenticated,
        loading,
        error,
        refresh: loadData,
      }}
    >
      {children}
    </HubContext.Provider>
  );
}

export function useHubData() {
  const context = useContext(HubContext);

  if (!context) {
    throw new Error("useHubData must be used inside HubProvider");
  }

  return context;
}
