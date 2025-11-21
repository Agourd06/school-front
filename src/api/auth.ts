import api from './axios';
import type { User } from './users';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Company {
  id: number;
  name: string;
  email?: string | null;
}

export interface LoginResponse {
  token: string;
  user?: {
    id?: number;
    email: string;
    username: string;
    role: string;
    company_id?: number | null;
    company?: Company | null;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role?: 'user' | 'admin';
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
      
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
   
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (token: string, data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post(`/auth/reset-password?token=${token}`, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  getProfile: async (): Promise<{ message: string; user: User }> => {
    const response = await api.get('/profile');
    return response.data;
  },
};

