import api from './axios';
import type { User } from './users';
import type { Company } from './company';
import type { Profile } from '../types/profile';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id?: number;
    email: string;
    username: string;
    profile: Profile;
    company_id?: number | null;
    company?: Company | null;
    roles?: string[];
    allowedPages?: string[];
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  company_id: number; // Required for initial registration (first user for company)
  // Password is NEVER provided - backend always sends password setup email
  // profile field is REMOVED - replaced with roles system (first user gets admin automatically)
  // role_ids field is NOT accepted - first user gets admin role automatically
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    profile: Profile;
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

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email: string;
  username: string;
}

export interface SetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordResponse {
  message: string;
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

  validateToken: async (data: ValidateTokenRequest): Promise<ValidateTokenResponse> => {
    const response = await api.post('/auth/validate-token', data);
    return response.data;
  },

  setPassword: async (data: SetPasswordRequest): Promise<SetPasswordResponse> => {
    const response = await api.post('/auth/set-password', data);
    return response.data;
  },
};

