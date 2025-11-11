import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';

export type PlanningSessionTypeStatus = 'active' | 'inactive';

export interface PlanningSessionTypeCompany {
  id: number;
  name: string;
  [key: string]: any;
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
  company_id?: number | null;
  status?: PlanningSessionTypeStatus;
}

export type UpdatePlanningSessionTypePayload = Partial<CreatePlanningSessionTypePayload>;

export interface GetPlanningSessionTypeParams extends PaginationParams {
  status?: PlanningSessionTypeStatus;
}

const toPaginated = (raw: any): PaginatedResponse<PlanningSessionType> => {
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
  const data = raw?.data || [];
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
    const { data } = await api.post('/planning-session-types', payload);
    return data;
  },

  async update(id: number, payload: UpdatePlanningSessionTypePayload): Promise<PlanningSessionType> {
    const { data } = await api.patch(`/planning-session-types/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/planning-session-types/${id}`);
  },
};

