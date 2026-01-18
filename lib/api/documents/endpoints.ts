/**
 * Documents API Endpoints
 */

export const documentsEndpoints = {
  list: (workspaceId: string) => `/workspaces/${workspaceId}/documents`,
  create: (workspaceId: string) => `/workspaces/${workspaceId}/documents`,
  get: (workspaceId: string, id: string) =>
    `/workspaces/${workspaceId}/documents/${id}`,
  update: (workspaceId: string, id: string) =>
    `/workspaces/${workspaceId}/documents/${id}`,
  delete: (workspaceId: string, id: string) =>
    `/workspaces/${workspaceId}/documents/${id}`,
};
