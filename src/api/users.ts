import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';
import type { Profile } from '../types/profile';

// Forward declaration
interface Company {
  id: number;
  name: string;
  email: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile: Profile;
  status?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  company?: Company;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  profile?: Profile;
  company_id: number; // Required for public registration
  role_ids: number[]; // REQUIRED: At least one role must be assigned
  // Password is NEVER provided - backend always sends password setup email
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  status?: number;
  company_id?: number;
  // profile field is REMOVED - replaced with roles system (manage via /users/:id/roles)
}

export const usersApi = {
  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (typeof params.status === 'number') queryParams.append('status', params.status.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    const response = await api.get(url);
    
    // Handle both direct array and wrapped response formats
    if (Array.isArray(response.data)) {
      // Legacy format - convert to paginated format
      return {
        data: response.data,
        meta: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
    
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post('/users', data);
    
    // Backend returns: { user: {...} }
    // Invitation email with token link is sent to user's email
    // User must click the link to set their password
    const responseData = response.data as { 
      user: User;
    };
    
    // Return only the user object - invitation email is sent separately
    return responseData.user;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  sendPasswordInvitationById: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/users/${id}/send-password-invitation`);
    return response.data;
  },

  sendPasswordInvitationByEmail: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/users/send-password-invitation-by-email', { email });
    return response.data;
  },
};

