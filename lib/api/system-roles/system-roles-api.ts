/**
 * System Roles API Functions
 */
import client from "../client";
import { systemRolesEndpoints } from "./endpoints";

// Types
export interface SystemRole {
  id: string;
  name: string;
  // Add more fields as needed
}

// API Functions
export const systemRolesApi = {
  /**
   * Get all system roles
   */
  list: async (): Promise<SystemRole[]> => {
    const response = await client.get<SystemRole[]>(
      systemRolesEndpoints.list()
    );
    return response.data;
  },

  /**
   * Get system role by ID
   */
  get: async (id: string): Promise<SystemRole> => {
    const response = await client.get<SystemRole>(systemRolesEndpoints.get(id));
    return response.data;
  },
};

// Types are already exported individually above
