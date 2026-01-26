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
  tertiaryColor?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  codePostal?: string | null;
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
  tertiaryColor?: string;
  country?: string;
  city?: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  logo?: string | File | null; // Supports both URL string, File upload, or null to remove
  email?: string;
  phone?: string;
  website?: string;
  status?: number;
  company_id?: number;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  country?: string;
  city?: string;
  address?: string;
  codePostal?: string;
}

export interface GetCompaniesParams extends FilterParams {
  company_id?: number;
}

const normalizeCompany = (company: Company & { primary_color?: string | null; secondary_color?: string | null; tertiary_color?: string | null; code_postal?: string | null }): Company => ({
  ...company,
  primaryColor: company.primaryColor ?? company.primary_color ?? null,
  secondaryColor: company.secondaryColor ?? company.secondary_color ?? null,
  tertiaryColor: company.tertiaryColor ?? company.tertiary_color ?? null,
  country: company.country ?? null,
  city: company.city ?? null,
  codePostal: company.codePostal ?? company.code_postal ?? null,
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
      // Always include CAPTCHA fields if provided (required for company creation)
      // Don't use conditional spread - always include if they exist in the data
      ...(data.captchaToken ? { captchaToken: data.captchaToken } : {}),
      ...(data.captchaAnswer ? { captchaAnswer: data.captchaAnswer } : {}),
    };
    
    const response = await api.post('/company', payload);
    return normalizeCompany(response.data);
  },

  update: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const { company_id: _companyId, ...rest } = data;
    void _companyId;
    
    // Check if we have a File (logo upload) or logo is explicitly null (remove logo)
    const hasFile = data.logo instanceof File;
    const shouldRemoveLogo = data.logo === null;
    
    // If we have a file or need to remove logo, use FormData
    if (hasFile || shouldRemoveLogo) {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'logo') {
            if (value instanceof File) {
              formData.append('logo', value);
            } else if (value === null) {
              // For removing logo, send empty string or omit the field
              formData.append('logo', '');
            }
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Note: Don't set Content-Type header - axios interceptor will handle it
      // The browser needs to set it with the correct multipart boundary
      const response = await api.patch(`/company/${id}`, formData);
      return normalizeCompany(response.data);
    }
    
    // Otherwise, use regular JSON
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

