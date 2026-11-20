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
import { getAccessToken } from "@/lib/api/client";
import { fetchHubData } from "@/lib/api/hub";
import { CustomerSnapshot } from "@/lib/types";

type HubState = {
  customer: CustomerSnapshot;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setCustomer: (customer: CustomerSnapshot) => void;
};

const emptyCustomer: CustomerSnapshot = {
  organization: "",
  primaryContact: "",
  email: "",
  phone: "",
};

const HubContext = createContext<HubState | null>(null);

export function HubProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSnapshot>(emptyCustomer);
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
          setAuthenticated(true);
        } else {
          setCustomer(emptyCustomer);
          setAuthenticated(false);
        }
      });
    } catch {
      // A failing endpoint is not a logged-out user: keep `authenticated` tied
      // to the token so the banner shows the error, not "Sign in".
      setError("Impossible de charger votre session depuis Crush.lu.");
      setAuthenticated(Boolean(getAccessToken()));
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
        authenticated,
        loading,
        error,
        refresh: loadData,
        setCustomer,
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
