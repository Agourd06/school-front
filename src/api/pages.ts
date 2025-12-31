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
   * Creates a profile-page assignment
   */
  assignPageToProfile: async (data: AssignProfilePageRequest): Promise<ProfilePage> => {
    const response = await api.post('/pages/assign', data);
    return response.data;
  },

  /**
   * Remove a page assignment from a profile
   */
  removePageFromProfile: async (profile: Profile, pageId: number): Promise<void> => {
    await api.delete(`/pages/assign/${profile}/${pageId}`);
  },

  /**
   * Get all pages assigned to a specific profile
   */
  getPagesForProfile: async (profile: Profile): Promise<Page[]> => {
    const response = await api.get(`/pages/profile/${profile}`);
    return response.data;
  },

  /**
   * Get all profiles that have access to a specific page
   */
  getProfilesForPage: async (pageId: number): Promise<Profile[]> => {
    const response = await api.get(`/pages/page/${pageId}/profiles`);
    return response.data;
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

