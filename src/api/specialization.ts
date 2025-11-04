import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { DEFAULT_COMPANY_ID } from '../constants/status';

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
  company_id?: number;
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
  company_id?: number;
}

export const specializationApi = {
  async getAll(params: GetSpecializationsParams = {}): Promise<PaginatedResponse<Specialization>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    if (params.program_id) qp.append('program_id', String(params.program_id));
    if (params.company_id) qp.append('company_id', String(params.company_id));
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
    const body = {
      status: 1,
      company_id: DEFAULT_COMPANY_ID,
      ...payload,
    };
    if (body.status === undefined || body.status === null) body.status = 1;
    if (!body.company_id) body.company_id = DEFAULT_COMPANY_ID;
    const { data } = await api.post('/specializations', body);
    return data;
  },

  async update(id: number, payload: UpdateSpecializationRequest): Promise<Specialization> {
    const body = {
      ...payload,
    };
    if (!('company_id' in body)) (body as any).company_id = DEFAULT_COMPANY_ID;
    const { data } = await api.patch(`/specializations/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/specializations/${id}`);
  },
};


