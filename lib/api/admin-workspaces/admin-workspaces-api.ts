/**
 * Admin Workspaces & Chatbots Stats API
 */
import client from "../client";
import { adminWorkspacesEndpoints } from "./endpoints";

/** GET /admin/workspaces/stats/summary */
export interface WorkspaceChatbotStatsSummary {
  total_workspaces: number;
  total_chatbots: number;
  avg_chatbots_per_workspace: number;
  workspaces_last_7_days: number;
  workspaces_last_30_days: number;
  chatbots_last_7_days: number;
  chatbots_last_30_days: number;
}

export const adminWorkspacesApi = {
  /** GET /admin/workspaces/stats/summary – thống kê toàn hệ thống (chỉ admin) */
  getStatsSummary: async (): Promise<WorkspaceChatbotStatsSummary> => {
    const response = await client.get<WorkspaceChatbotStatsSummary>(
      adminWorkspacesEndpoints.statsSummary()
    );
    return response.data;
  },
};
