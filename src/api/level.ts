import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

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
  company_id?: number; // Optional - backend sets it from authenticated user
}

export type UpdateLevelRequest = Partial<CreateLevelRequest>;

export interface GetLevelsParams extends FilterParams {
  specialization_id?: number;
}

const toPaginated = (raw: unknown): PaginatedResponse<Level> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as Level[],
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
  const rawObj = raw as { meta?: { totalPages?: number; lastPage?: number; page?: number; limit?: number; total?: number; hasNext?: boolean; hasPrevious?: boolean }; data?: Level[] };
  const meta = rawObj?.meta || {};
  const rawData = rawObj?.data || [];
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(rawData) ? rawData.length : 10);
  return {
    data: Array.isArray(rawData) ? rawData : [],
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
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId({
      status: 1,
      ...payload,
    });
    const bodyWithDefaults = body as CreateLevelRequest & { status?: number };
    if (bodyWithDefaults.status === undefined || bodyWithDefaults.status === null) {
      bodyWithDefaults.status = 1;
    }
    const { data } = await api.post('/levels', body);
    return data;
  },

  async update(id: number, payload: UpdateLevelRequest): Promise<Level> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/levels/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/levels/${id}`);
  },
};


