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
  picture?: string | null; // Relative path: /uploads/{companyId}/users/{timestamp}_{filename}
  phone?: string | null; // Format: +{countrycode}{nationalnumber}
  privacyPolicyAccepted?: boolean; // Whether user has accepted Privacy Policy
  termsAccepted?: boolean; // Whether user has accepted Terms of Use
  consentAcceptedAt?: string | null; // ISO 8601 datetime when consent was accepted
  status?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  company?: Company;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  phone?: string;
  picture?: File;
  profile?: Profile;
  company_id: number; // Required for public registration
  role_ids?: number[]; // Optional: Roles can be assigned after user creation via /users/:id/roles endpoint
  // Password is NEVER provided - backend always sends password setup email
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  phone?: string;
  status?: number;
  company_id?: number;
  picture?: string | File | null;
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
    // Check if we have a File (picture upload)
    const hasFile = data.picture instanceof File;
    
    let response;
    if (hasFile) {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('company_id', String(data.company_id));
      if (data.phone) formData.append('phone', data.phone);
      if (data.picture instanceof File) formData.append('picture', data.picture);
      if (data.role_ids && data.role_ids.length > 0) {
        data.role_ids.forEach(id => formData.append('role_ids[]', String(id)));
      }
      response = await api.post('/users', formData);
    } else {
      // Send only the required fields without undefined values
      const jsonData: Record<string, unknown> = {
        username: data.username,
        email: data.email,
        company_id: data.company_id,
      };
      if (data.phone) jsonData.phone = data.phone;
      if (data.role_ids && data.role_ids.length > 0) jsonData.role_ids = data.role_ids;
      
      response = await api.post('/users', jsonData);
    }
    
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
    // Check if we have a File (picture upload) or picture is explicitly null (remove picture)
    const hasFile = data.picture instanceof File;
    const shouldRemovePicture = data.picture === null;
    
    // If we have a file or need to remove picture, use FormData
    if (hasFile || shouldRemovePicture) {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'picture') {
            if (value instanceof File) {
              formData.append('picture', value);
            } else if (value === null) {
              formData.append('picture', '');
            }
          } else if (value !== null) {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.patch(`/users/${id}`, formData);
      return response.data;
    }
    
    // Otherwise, use regular JSON
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

