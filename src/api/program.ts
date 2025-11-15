import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface Program {
  id: number;
  title: string;
  description?: string | null;
  status?: number;
  company_id?: number | null;
  created_at?: string;
  updated_at?: string;
  specializations?: any[];
}

export interface CreateProgramRequest {
  title: string;
  description?: string;
  status?: number;
  company_id?: number; // Optional - backend sets it from authenticated user
}

export type UpdateProgramRequest = Partial<CreateProgramRequest>;

const toPaginated = (raw: any): PaginatedResponse<Program> => {
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

export const programApi = {
  async getAll(params: FilterParams = {}): Promise<PaginatedResponse<Program>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    const qs = qp.toString();
    const url = qs ? `/programs?${qs}` : '/programs';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<Program> {
    const { data } = await api.get(`/programs/${id}`);
    return data;
  },

  async create(payload: CreateProgramRequest): Promise<Program> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId({
      status: 1,
      ...payload,
    });
    if (body.status === undefined || body.status === null) (body as any).status = 1;
    const { data } = await api.post('/programs', body);
    return data;
  },

  async update(id: number, payload: UpdateProgramRequest): Promise<Program> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/programs/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/programs/${id}`);
  },
};


