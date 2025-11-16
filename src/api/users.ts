import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

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
  role: 'user' | 'admin';
  status?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  company?: Company;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  role?: 'user' | 'admin';
  company_id?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  status?: number;
  company_id?: number;
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
    
    console.log('Users API request params:', params);
    console.log('Users API request URL:', url);
    
    const response = await api.get(url);
    console.log('Users API response:', response.data);
    
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
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

