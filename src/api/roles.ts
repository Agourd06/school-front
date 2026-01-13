import api from './axios';
import type { PaginatedResponse, SearchParams } from '../types/api';

/**
 * Role interface - represents a role in the RBAC system
 */
export interface Role {
  id: number;
  code: string;
  label: string;
  company_id: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Request to create a new role
 */
export interface CreateRoleRequest {
  code: string;
  label: string;
  is_system?: boolean; // Must be false when creating via API
}

/**
 * Request to update a role
 */
export interface UpdateRoleRequest {
  label?: string;
  // code and is_system cannot be changed
}

/**
 * Query parameters for getting roles
 */
export interface GetRolesParams extends SearchParams {
  is_system?: boolean;
}

/**
 * Helper function to normalize paginated response
 */
const toPaginated = (raw: unknown): PaginatedResponse<Role> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as Role[],
      meta: {
        page: 1,
        limit: raw.length,
        total: raw.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  const rawObj = raw as {
    data?: Role[];
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      lastPage?: number;
      hasNext?: boolean;
      hasPrevious?: boolean;
    };
  };

  const meta = rawObj?.meta || {};
  const rawData = rawObj?.data || [];
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(rawData) ? rawData.length : 10);

  return {
    data: Array.isArray(rawData) ? rawData : [],
    meta: {
      page,
      limit,
      total: meta.total ?? (Array.isArray(rawData) ? rawData.length : 0),
      totalPages,
      hasNext: meta.hasNext ?? page < totalPages,
      hasPrevious: meta.hasPrevious ?? page > 1,
    },
  };
};

/**
 * API for managing roles (Admin only)
 */
export const rolesApi = {
  /**
   * Get all roles with pagination and search
   */
  getAll: async (params: GetRolesParams = {}): Promise<PaginatedResponse<Role>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (params.is_system !== undefined) queryParams.append('is_system', params.is_system.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/roles?${queryString}` : '/roles';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  /**
   * Get a specific role by ID
   */
  getById: async (id: number): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  /**
   * Create a new role
   */
  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await api.post('/roles', {
      ...data,
      is_system: false, // Always false when creating via API
    });
    return response.data;
  },

  /**
   * Update a role
   */
  update: async (id: number, data: UpdateRoleRequest): Promise<Role> => {
    const response = await api.patch(`/roles/${id}`, data);
    return response.data;
  },

  /**
   * Delete a role (cannot delete system roles)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  /**
   * Get pages assigned to a role
   */
  getPages: async (id: number): Promise<import('./pages').Page[]> => {
    const response = await api.get(`/roles/${id}/pages`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Assign a page to a role
   */
  assignPage: async (roleId: number, pageId: number): Promise<{ role_id: number; page_id: number; company_id: number; created_at: string }> => {
    const response = await api.post(`/roles/${roleId}/pages`, { page_id: pageId });
    return response.data;
  },

  /**
   * Remove a page from a role
   */
  removePage: async (roleId: number, pageId: number): Promise<void> => {
    await api.delete(`/roles/${roleId}/pages/${pageId}`);
  },
};
