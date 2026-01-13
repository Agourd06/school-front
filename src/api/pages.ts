import api from './axios';
import type { Profile } from '../types/profile';
import type { PaginatedResponse, SearchParams } from '../types/api';

/**
 * Page interface - represents a predefined page/route in the system
 */
export interface Page {
  id: number;
  title: string;
  route: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  profilePages?: ProfilePage[];
}

/**
 * ProfilePage assignment interface - links a profile to a page
 */
export interface ProfilePage {
  profile: Profile;
  page_id: number;
  company_id: number;
  created_at: string;
}

/**
 * Request to assign a page to a profile
 */
export interface AssignProfilePageRequest {
  profile: Profile;
  page_id: number;
}

/**
 * Response containing allowed routes for current user
 */
export interface AllowedRoutesResponse {
  routes: string[];
}

/**
 * Request to create a new page
 */
export interface CreatePageRequest {
  title: string;
  route: string;
}

/**
 * Request to create multiple pages from routes
 */
export interface CreatePagesFromRoutesRequest {
  routes: Array<{
    route: string;
    title: string;
  }>;
  skipExisting?: boolean;
}

/**
 * Response from bulk page creation
 */
export interface CreatePagesFromRoutesResponse {
  created: number;
  skipped: number;
  pages: Page[];
  errors: string[];
}

/**
 * Query parameters for getting pages
 */
export interface GetPagesParams extends SearchParams {
  // Additional filters can be added here if needed
}

/**
 * Helper function to normalize paginated response
 */
const toPaginated = (raw: unknown): PaginatedResponse<Page> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as Page[],
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
    data?: Page[];
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
 * API for managing page access control
 * All endpoints require admin profile (except getMyRoutes)
 */
export const pagesApi = {
  /**
   * Get all available pages for the company with pagination and search
   * Returns paginated pages that can be assigned to profiles
   */
  getAll: async (params: GetPagesParams = {}): Promise<PaginatedResponse<Page>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/pages?${queryString}` : '/pages';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  /**
   * Create a new page
   * Creates a page with title and route for the company
   */
  create: async (data: CreatePageRequest): Promise<Page> => {
    const response = await api.post('/pages', data);
    return response.data;
  },

  /**
   * Create multiple pages from routes (bulk creation)
   * Creates pages for all provided routes in a single request
   */
  createFromRoutes: async (data: CreatePagesFromRoutesRequest): Promise<CreatePagesFromRoutesResponse> => {
    const response = await api.post('/pages/create-from-routes', {
      routes: data.routes,
      skipExisting: data.skipExisting ?? true,
    });
    return response.data;
  },

  /**
   * Get a specific page by ID
   */
  getById: async (id: number): Promise<Page> => {
    const response = await api.get(`/pages/${id}`);
    return response.data;
  },

  /**
   * Assign a page to a profile
   * @deprecated This endpoint has been removed. Use rolesApi.assignPage(roleId, pageId) instead.
   * Migration: Profiles have been replaced with roles. Use /roles/:roleId/pages endpoint.
   */
  assignPageToProfile: async (_data: AssignProfilePageRequest): Promise<ProfilePage> => {
    throw new Error(
      `The /pages/assign endpoint has been removed. ` +
      `Please use rolesApi.assignPage(roleId, pageId) to assign pages to a role. ` +
      `See docs/PAGES_ENDPOINT_MIGRATION.md for migration guide.`
    );
  },

  /**
   * Remove a page assignment from a profile
   * @deprecated This endpoint has been removed. Use rolesApi.removePage(roleId, pageId) instead.
   * Migration: Profiles have been replaced with roles. Use /roles/:roleId/pages/:pageId endpoint.
   */
  removePageFromProfile: async (profile: Profile, pageId: number): Promise<void> => {
    throw new Error(
      `The /pages/assign/${profile}/${pageId} endpoint has been removed. ` +
      `Please use rolesApi.removePage(roleId, pageId) to remove pages from a role. ` +
      `See docs/PAGES_ENDPOINT_MIGRATION.md for migration guide.`
    );
  },

  /**
   * Get all pages assigned to a specific profile
   * @deprecated This endpoint has been removed. Use rolesApi.getPages(roleId) instead.
   * Migration: Profiles have been replaced with roles. Use /roles/:roleId/pages endpoint.
   */
  getPagesForProfile: async (profile: Profile): Promise<Page[]> => {
    throw new Error(
      `The /pages/profile/${profile} endpoint has been removed. ` +
      `Please use rolesApi.getPages(roleId) to get pages for a role. ` +
      `See docs/PAGES_ENDPOINT_MIGRATION.md for migration guide.`
    );
  },

  /**
   * Get pages assigned to a specific role (admin only)
   * Alternative endpoint: You can also use rolesApi.getPages(roleId)
   */
  getPagesForRole: async (roleId: number): Promise<Page[]> => {
    const response = await api.get(`/roles/${roleId}/pages`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get all profiles that have access to a specific page
   * @deprecated This endpoint has been removed. Profiles have been replaced with roles.
   * Migration: Use roles API to get roles that have access to a page.
   */
  getProfilesForPage: async (pageId: number): Promise<Profile[]> => {
    throw new Error(
      `The /pages/page/${pageId}/profiles endpoint has been removed. ` +
      `Profiles have been replaced with roles. ` +
      `See docs/PAGES_ENDPOINT_MIGRATION.md for migration guide.`
    );
  },

  /**
   * Get current user's allowed routes based on their profile
   * Available to all authenticated users (not just admin)
   */
  getMyRoutes: async (): Promise<string[]> => {
    const response = await api.get('/pages/my-routes');
    return response.data.routes;
  },
};

