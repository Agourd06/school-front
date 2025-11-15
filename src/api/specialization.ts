import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface Specialization {
  id: number;
  title: string;
  program_id: number;
  status?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  program?: {
    id: number;
    title: string;
  } | null;
}

export interface CreateSpecializationRequest {
  title: string;
  program_id: number;
  status?: number;
  company_id?: number; // Optional - backend sets it from authenticated user
}

export type UpdateSpecializationRequest = Partial<CreateSpecializationRequest>;

const toPaginated = (raw: any): PaginatedResponse<Specialization> => {
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

export interface GetSpecializationsParams extends FilterParams {
  program_id?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

export const specializationApi = {
  async getAll(params: GetSpecializationsParams = {}): Promise<PaginatedResponse<Specialization>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    if (params.program_id) qp.append('program_id', String(params.program_id));
    // company_id is automatically filtered by backend from JWT token, no need to send it
    const qs = qp.toString();
    const url = qs ? `/specializations?${qs}` : '/specializations';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<Specialization> {
    const { data } = await api.get(`/specializations/${id}`);
    return data;
  },

  async create(payload: CreateSpecializationRequest): Promise<Specialization> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify the program belongs to the same company
    const body = ensureCompanyId({
      status: 1,
      ...payload,
    });
    if (body.status === undefined || body.status === null) (body as any).status = 1;
    const { data } = await api.post('/specializations', body);
    return data;
  },

  async update(id: number, payload: UpdateSpecializationRequest): Promise<Specialization> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating program_id, backend will verify the new program belongs to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/specializations/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/specializations/${id}`);
  },
};


