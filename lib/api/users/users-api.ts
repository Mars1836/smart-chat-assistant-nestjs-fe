/**
 * Users API – profile, list (admin), CRUD
 */
import client from "../client";
import { usersEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  language: string;
  system_role_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  avatar_url?: string;
  language?: string;
  system_role_id?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  avatar_url?: string;
  language?: string;
  system_role_id?: string | null;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** GET /users/stats/summary – thống kê tổng quan (chỉ admin) */
export interface UserStatsSummary {
  total: number;
  by_role: { admin: number; user: number; no_role: number };
  new_last_7_days: number;
  new_last_30_days: number;
}

/** GET /users/stats/by-date – thống kê theo ngày/tuần/tháng (chỉ admin) */
export interface UserStatsByDateItem {
  date: string;
  count: number;
}

export interface ListUserStatsByDateParams {
  from?: string; // ISO date YYYY-MM-DD
  to?: string;
  groupBy?: "day" | "week" | "month";
}

export const usersApi = {
  /** GET /users/profile – profile user đang đăng nhập */
  getProfile: async (): Promise<UserProfileDto> => {
    const response = await client.get<UserProfileDto>(usersEndpoints.profile());
    return response.data;
  },

  /** GET /users – danh sách user (chỉ admin), phân trang */
  list: async (
    params?: ListUsersParams
  ): Promise<PaginatedResponse<UserProfileDto>> => {
    const response = await client.get<PaginatedResponse<UserProfileDto>>(
      usersEndpoints.list(),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy ?? "created_at",
          sortOrder: params?.sortOrder ?? "DESC",
        },
      }
    );
    return response.data;
  },

  /** GET /users/:id – chi tiết user (user thường chỉ :id = mình; admin xem bất kỳ) */
  get: async (id: string): Promise<UserProfileDto> => {
    const response = await client.get<UserProfileDto>(usersEndpoints.get(id));
    return response.data;
  },

  /** POST /users – tạo user (chỉ admin) */
  create: async (data: CreateUserDto): Promise<UserProfileDto> => {
    const response = await client.post<UserProfileDto>(
      usersEndpoints.create(),
      data
    );
    return response.data;
  },

  /** PATCH /users/profile – cập nhật profile chính mình */
  updateProfile: async (data: UpdateUserDto): Promise<UserProfileDto> => {
    const response = await client.patch<UserProfileDto>(
      usersEndpoints.updateProfile(),
      data
    );
    return response.data;
  },

  /** PATCH /users/:id – cập nhật user (user chỉ sửa mình; admin sửa bất kỳ) */
  update: async (id: string, data: UpdateUserDto): Promise<UserProfileDto> => {
    const response = await client.patch<UserProfileDto>(
      usersEndpoints.update(id),
      data
    );
    return response.data;
  },

  /** DELETE /users/:id – xóa user (chỉ admin, không xóa chính mình) */
  delete: async (id: string): Promise<void> => {
    await client.delete(usersEndpoints.delete(id));
  },

  /** GET /users/stats/summary – thống kê tổng quan (chỉ admin) */
  getStatsSummary: async (): Promise<UserStatsSummary> => {
    const response = await client.get<UserStatsSummary>(
      usersEndpoints.statsSummary()
    );
    return response.data;
  },

  /** GET /users/stats/by-date – thống kê theo thời gian (chỉ admin) */
  getStatsByDate: async (
    params?: ListUserStatsByDateParams
  ): Promise<UserStatsByDateItem[]> => {
    const response = await client.get<UserStatsByDateItem[]>(
      usersEndpoints.statsByDate(),
      { params: params ?? {} }
    );
    return response.data;
  },
};
