/**
 * LLM Models API Endpoints
 */
const BASE = "/llm-models";

export const llmModelsEndpoints = {
  pricing: () => `${BASE}/pricing`,
  list: () => BASE,
  get: (id: string) => `${BASE}/${id}`,
  create: () => BASE,
  update: (id: string) => `${BASE}/${id}`,
  delete: (id: string) => `${BASE}/${id}`,
};
