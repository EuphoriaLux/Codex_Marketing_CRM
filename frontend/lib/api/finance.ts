import { apiGet, getAccessToken } from "@/lib/api/client";
import {
  PaymentsInResponse,
  PaymentsOutResponse,
  PayrollResponse,
  RefundsResponse,
} from "@/lib/api/contracts";
import {
  PaymentInItem,
  PaymentOutItem,
  PayrollItem,
  RefundItem,
} from "@/lib/types";

export type FinanceDataPayload = {
  paymentsIn: PaymentInItem[];
  paymentsOut: PaymentOutItem[];
  payroll: PayrollItem[];
  refunds: RefundItem[];
};

export async function fetchPaymentsIn(): Promise<PaymentInItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<PaymentsInResponse>("/hub/payments-in");
  return res.items || [];
}

export async function fetchPaymentsOut(): Promise<PaymentOutItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<PaymentsOutResponse>("/hub/payments-out");
  return res.items || [];
}

export async function fetchPayroll(): Promise<PayrollItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<PayrollResponse>("/hub/payroll");
  return res.items || [];
}

export async function fetchRefunds(): Promise<RefundItem[]> {
  if (!getAccessToken()) return [];
  const res = await apiGet<RefundsResponse>("/hub/refunds");
  return res.items || [];
}

export async function fetchAllFinanceData(): Promise<FinanceDataPayload> {
  if (!getAccessToken()) {
    return { paymentsIn: [], paymentsOut: [], payroll: [], refunds: [] };
  }

  const [inRes, outRes, payRes, refRes] = await Promise.all([
    apiGet<PaymentsInResponse>("/hub/payments-in"),
    apiGet<PaymentsOutResponse>("/hub/payments-out"),
    apiGet<PayrollResponse>("/hub/payroll"),
    apiGet<RefundsResponse>("/hub/refunds"),
  ]);

  return {
    paymentsIn: inRes.items || [],
    paymentsOut: outRes.items || [],
    payroll: payRes.items || [],
    refunds: refRes.items || [],
  };
}
