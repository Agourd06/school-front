import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';

export type LevelPricingStatus = -2 | -1 | 0 | 1 | 2;

export interface LevelPricingLevel {
  id: number;
  title?: string | null;
}

export interface LevelPricingCompany {
  id: number;
  name?: string | null;
}

export interface LevelPricing {
  id: number;
  level_id: number;
  title: string;
  amount: string;
  occurrences: number;
  every_month: number;
  company_id?: number | null;
  status: LevelPricingStatus;
  created_at?: string;
  updated_at?: string;
  level?: LevelPricingLevel | null;
  company?: LevelPricingCompany | null;
}

export interface CreateLevelPricingPayload {
  level_id: number;
  title: string;
  amount: number;
  occurrences?: number;
  every_month?: number;
  company_id?: number | null;
  status?: LevelPricingStatus;
}

export type UpdateLevelPricingPayload = Partial<CreateLevelPricingPayload>;

export interface GetLevelPricingParams extends PaginationParams {
  status?: LevelPricingStatus;
  level_id?: number;
  company_id?: number;
  search?: string;
}

const toPaginated = (raw: any): PaginatedResponse<LevelPricing> => {
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

  const data = raw?.data ?? [];
  const meta = raw?.meta ?? {};
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(data) ? data.length : 10);
  const total = meta.total ?? (Array.isArray(data) ? data.length : 0);
  const totalPages = meta.totalPages ?? meta.lastPage ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: meta.hasNext ?? page < totalPages,
      hasPrevious: meta.hasPrevious ?? page > 1,
    },
  };
};

const buildQueryString = (params: GetLevelPricingParams = {}): string => {
  const qp = new URLSearchParams();

  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.level_id) qp.append('level_id', String(params.level_id));
  if (params.company_id) qp.append('company_id', String(params.company_id));
  if (params.search) qp.append('search', params.search);

  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const levelPricingApi = {
  async getAll(params: GetLevelPricingParams = {}): Promise<PaginatedResponse<LevelPricing>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/level-pricings${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<LevelPricing> {
    const { data } = await api.get(`/level-pricings/${id}`);
    return data;
  },

  async create(payload: CreateLevelPricingPayload): Promise<LevelPricing> {
    const body = {
      occurrences: 1,
      every_month: 0,
      status: 2,
      ...payload,
    };
    const { data } = await api.post('/level-pricings', body);
    return data;
  },

  async update(id: number, payload: UpdateLevelPricingPayload): Promise<LevelPricing> {
    const { data } = await api.patch(`/level-pricings/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/level-pricings/${id}`);
  },
};

export default levelPricingApi;


