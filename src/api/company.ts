import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { DEFAULT_COMPANY_ID } from '../constants/status';

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
  status?: number;
  company_id?: number;
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
  status?: number;
  company_id?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: number;
  company_id?: number;
}

export interface GetCompaniesParams extends FilterParams {
  company_id?: number;
}

const toPaginated = (raw: any): PaginatedResponse<Company> => {
  if (Array.isArray(raw)) {
    return {
      data: raw,
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

  const meta = raw?.meta || {};
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(raw?.data) ? raw.data.length : 10);

  return {
    data: raw?.data || [],
    meta: {
      page,
      limit,
      total: meta.total ?? (Array.isArray(raw?.data) ? raw.data.length : 0),
      totalPages,
      hasNext: meta.hasNext ?? page < totalPages,
      hasPrevious: meta.hasPrevious ?? page > 1,
    },
  };
};

export const companyApi = {
  getAll: async (params: GetCompaniesParams = {}): Promise<PaginatedResponse<Company>> => {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    if (params.company_id) qp.append('company_id', String(params.company_id));

    const qs = qp.toString();
    const url = qs ? `/company?${qs}` : '/company';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  getById: async (id: number): Promise<Company> => {
    const response = await api.get(`/company/${id}`);
    return response.data;
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const payload = {
      status: 1,
      company_id: DEFAULT_COMPANY_ID,
      ...data,
    };
    if (payload.status === undefined || payload.status === null) (payload as any).status = 1;
    if (!payload.company_id) (payload as any).company_id = DEFAULT_COMPANY_ID;
    const response = await api.post('/company', payload);
    return response.data;
  },

  update: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const payload = {
      ...data,
    };
    if (!('company_id' in payload)) (payload as any).company_id = DEFAULT_COMPANY_ID;
    const response = await api.patch(`/company/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  },
};

