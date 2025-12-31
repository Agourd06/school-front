import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import type { Profile } from '../types/profile';
// Forward declarations to avoid circular imports
interface User {
  id: number;
  username: string;
  email: string;
  profile: Profile;
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
  primaryColor?: string | null;
  secondaryColor?: string | null;
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
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: number;
  company_id?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface GetCompaniesParams extends FilterParams {
  company_id?: number;
}

const normalizeCompany = (company: Company & { primary_color?: string | null; secondary_color?: string | null }): Company => ({
  ...company,
  primaryColor: company.primaryColor ?? company.primary_color ?? null,
  secondaryColor: company.secondaryColor ?? company.secondary_color ?? null,
});

const toPaginated = (raw: unknown): PaginatedResponse<Company> => {
  if (Array.isArray(raw)) {
    return {
      data: (raw as Company[]).map((company) => normalizeCompany(company)),
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

  const rawObj = raw as { meta?: { totalPages?: number; lastPage?: number; page?: number; limit?: number; total?: number; hasNext?: boolean; hasPrevious?: boolean }; data?: Company[] };
  const meta = rawObj?.meta || {};
  const rawData = rawObj?.data || [];
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(rawData) ? rawData.length : 10);

  return {
    data: Array.isArray(rawData) ? rawData.map((company) => normalizeCompany(company as Company)) : [],
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
    return normalizeCompany(response.data);
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const { company_id: _companyId, status: incomingStatus, ...rest } = data;
    void _companyId;
    const payload: CreateCompanyRequest = {
      ...rest,
      status: incomingStatus ?? 1,
    };
    const response = await api.post('/company', payload);
    return normalizeCompany(response.data);
  },

  update: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const { company_id: _companyId, ...rest } = data;
    void _companyId;
    const payload: UpdateCompanyRequest = {
      ...rest,
    };
    const response = await api.patch(`/company/${id}`, payload);
    return normalizeCompany(response.data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  },
};

