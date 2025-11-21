import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export type PlanningSessionTypeStatus = 'active' | 'inactive';

export interface PlanningSessionTypeCompany {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface PlanningSessionType {
  id: number;
  title: string;
  type: string;
  coefficient?: number | null;
  status: PlanningSessionTypeStatus;
  company_id?: number | null;
  company?: PlanningSessionTypeCompany | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlanningSessionTypePayload {
  title: string;
  type: string;
  coefficient?: number | null;
  company_id?: number | null; // Optional - backend sets it from authenticated user
  status?: PlanningSessionTypeStatus;
}

export type UpdatePlanningSessionTypePayload = Partial<CreatePlanningSessionTypePayload>;

export interface GetPlanningSessionTypeParams extends PaginationParams {
  status?: PlanningSessionTypeStatus;
}

const toPaginated = (raw: unknown): PaginatedResponse<PlanningSessionType> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as PlanningSessionType[],
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

  const rawObj = raw as { meta?: { page?: number; limit?: number; total?: number; totalPages?: number; lastPage?: number; hasNext?: boolean; hasPrevious?: boolean }; data?: PlanningSessionType[] };
  const meta = rawObj?.meta || {};
  const data = rawObj?.data || [];
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

const buildQueryString = (params: GetPlanningSessionTypeParams = {}) => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status) qp.append('status', params.status);
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const planningSessionTypeApi = {
  async getAll(params: GetPlanningSessionTypeParams = {}): Promise<PaginatedResponse<PlanningSessionType>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/planning-session-types${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<PlanningSessionType> {
    const { data } = await api.get(`/planning-session-types/${id}`);
    return data;
  },

  async create(payload: CreatePlanningSessionTypePayload): Promise<PlanningSessionType> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId(payload);
    const { data } = await api.post('/planning-session-types', body);
    return data;
  },

  async update(id: number, payload: UpdatePlanningSessionTypePayload): Promise<PlanningSessionType> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/planning-session-types/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/planning-session-types/${id}`);
  },
};

