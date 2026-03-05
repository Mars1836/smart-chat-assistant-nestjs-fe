/**
 * Payments API – list, detail, stats (summary + by-date)
 */
import client from "../client";
import { paymentsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

export interface PaymentUser {
  id: string;
  name: string;
  email: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: string;
  description: string | null;
  provider: "sepay" | string; // SePay is the primary provider
  transaction_id: string;
  status: "pending" | "success" | "failed";
  created_at: string;
  updated_at: string;
  user?: PaymentUser;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "amount";
  sortOrder?: "ASC" | "DESC";
  status?: "pending" | "success" | "failed";
  provider?: string; // 'sepay' or others
  user_id?: string; // admin only
}

/** GET /payments/stats/summary */
export interface PaymentStatsSummary {
  total_count: number;
  total_amount_success: string;
  /** Partial: SePay only returns statuses that exist (primarily 'success') */
  by_status: Partial<Record<"pending" | "success" | "failed", number>>;
  /** Partial: currently 'sepay' only */
  by_provider: Partial<Record<string, number>>;
  success_last_7_days: number;
  success_last_30_days: number;
}

export interface PaymentStatsSummaryParams {
  user_id?: string; // admin only
}

/** GET /payments/stats/by-date */
export interface PaymentStatsByDateItem {
  date: string;
  count: number;
  amount: string;
}

export interface ListPaymentStatsByDateParams {
  from?: string;
  to?: string;
  groupBy?: "day" | "week" | "month";
  user_id?: string; // admin only
}

export const paymentsApi = {
  /** GET /payments – danh sách giao dịch (user: của mình; admin: tất cả, có thể lọc user_id) */
  list: async (
    params?: ListPaymentsParams
  ): Promise<PaginatedResponse<Payment>> => {
    const response = await client.get<PaginatedResponse<Payment>>(
      paymentsEndpoints.list(),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy ?? "created_at",
          sortOrder: params?.sortOrder ?? "DESC",
          ...(params?.status && { status: params.status }),
          ...(params?.provider && { provider: params.provider }),
          ...(params?.user_id && { user_id: params.user_id }),
        },
      }
    );
    return response.data;
  },

  /** GET /payments/:id – chi tiết giao dịch */
  get: async (id: string): Promise<Payment> => {
    const response = await client.get<Payment>(paymentsEndpoints.get(id));
    return response.data;
  },

  /** GET /payments/stats/summary – thống kê tổng quan (admin có thể truyền user_id) */
  getStatsSummary: async (
    params?: PaymentStatsSummaryParams
  ): Promise<PaymentStatsSummary> => {
    const response = await client.get<PaymentStatsSummary>(
      paymentsEndpoints.statsSummary(),
      { params: params ?? {} }
    );
    return response.data;
  },

  /** GET /payments/stats/by-date – thống kê theo thời gian (admin có thể truyền user_id) */
  getStatsByDate: async (
    params?: ListPaymentStatsByDateParams
  ): Promise<PaymentStatsByDateItem[]> => {
    const response = await client.get<PaymentStatsByDateItem[]>(
      paymentsEndpoints.statsByDate(),
      { params: params ?? {} }
    );
    return response.data;
  },
};
