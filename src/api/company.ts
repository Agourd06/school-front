import api from './axios';

// Forward declarations to avoid circular imports
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  company_id?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status: number;
  company_id?: number;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status: number;
  company_id?: number;
}

export interface Company {
  id: number;
  name: string;
  logo?: string;
  email: string;
  phone?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
  users?: User[];
  modules?: Module[];
  courses?: Course[];
}

export interface CreateCompanyRequest {
  name: string;
  logo?: string;
  email: string;
  phone?: string;
  website?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    const response = await api.get('/company');
    return response.data;
  },

  getById: async (id: number): Promise<Company> => {
    const response = await api.get(`/company/${id}`);
    return response.data;
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const response = await api.post('/company', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const response = await api.patch(`/company/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  },
};

