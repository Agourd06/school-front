import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { DEFAULT_COMPANY_ID } from '../constants/status';

export interface Level {
  id: number;
  title: string;
  description?: string | null;
  level?: number | null;
  status?: number;
  company_id?: number;
  specialization_id: number;
  specialization?: {
    id: number;
    title: string;
    program?: {
      id: number;
      title: string;
    } | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLevelRequest {
  title: string;
  description?: string;
  level?: number;
  specialization_id: number;
  status?: number;
  company_id?: number;
}

export type UpdateLevelRequest = Partial<CreateLevelRequest>;

export interface GetLevelsParams extends FilterParams {
  specialization_id?: number;
}

const toPaginated = (raw: any): PaginatedResponse<Level> => {
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

export const levelApi = {
  async getAll(params: GetLevelsParams = {}): Promise<PaginatedResponse<Level>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    if (params.specialization_id) qp.append('specialization_id', String(params.specialization_id));
    const qs = qp.toString();
    const url = qs ? `/levels?${qs}` : '/levels';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<Level> {
    const { data } = await api.get(`/levels/${id}`);
    return data;
  },

  async create(payload: CreateLevelRequest): Promise<Level> {
    const body = {
      status: 1,
      company_id: DEFAULT_COMPANY_ID,
      ...payload,
    };
    if (body.status === undefined || body.status === null) body.status = 1;
    if (!body.company_id) body.company_id = DEFAULT_COMPANY_ID;
    const { data } = await api.post('/levels', body);
    return data;
  },

  async update(id: number, payload: UpdateLevelRequest): Promise<Level> {
    const body = {
      ...payload,
    };
    if (!('company_id' in body)) (body as any).company_id = DEFAULT_COMPANY_ID;
    const { data } = await api.patch(`/levels/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/levels/${id}`);
  },
};


