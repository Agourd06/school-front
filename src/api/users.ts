import api from './axios';

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
  company_id?: number;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
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

