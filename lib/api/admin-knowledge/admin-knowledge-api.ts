/**
 * Admin Knowledge Stats API
 */
import client from "../client";
import { adminKnowledgeEndpoints } from "./endpoints";

/** GET /admin/knowledge/stats/summary */
export interface KnowledgeStatsSummary {
  total_knowledge_bases: number;
  total_documents: number;
  /** Total size in bytes – FE should format to MB/GB */
  total_size: string;
  by_status: Partial<Record<"active" | "indexing" | "error", number>>;
  knowledge_last_7_days: number;
  knowledge_last_30_days: number;
}

export const adminKnowledgeApi = {
  /** GET /admin/knowledge/stats/summary – thống kê knowledge toàn hệ thống (chỉ admin) */
  getStatsSummary: async (): Promise<KnowledgeStatsSummary> => {
    const response = await client.get<KnowledgeStatsSummary>(
      adminKnowledgeEndpoints.statsSummary()
    );
    return response.data;
  },
};
