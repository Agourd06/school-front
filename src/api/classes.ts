import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface ClassEntity {
  id: number;
  title: string;
  description?: string;
  status: number;
  company_id?: number;
  program_id: number;
  specialization_id: number;
  level_id: number;
  school_year_id: number;
  school_year_period_id: number;
  created_at?: string;
  updated_at?: string;
  program?: { id: number; title: string } | null;
  specialization?: { id: number; title: string } | null;
  level?: { id: number; title: string } | null;
  schoolYear?: { id: number; title: string } | null;
  schoolYearPeriod?: { id: number; title: string } | null;
}

export interface CreateClassRequest {
  title: string;
  description?: string;
  status?: number;
  company_id?: number; // Optional - backend sets it from authenticated user
  program_id: number;
  specialization_id: number;
  level_id: number;
  school_year_id: number;
  school_year_period_id?: number;
}

export type UpdateClassRequest = Partial<CreateClassRequest>;

export interface GetClassesParams extends FilterParams {
  // company_id is automatically filtered by backend from JWT, no need to send it
  program_id?: number;
  specialization_id?: number;
  level_id?: number;
  school_year_id?: number;
  school_year_period_id?: number;
  student_id?: number;
}

const toPaginated = (raw: unknown): PaginatedResponse<ClassEntity> => {
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

export const classesApi = {
  async getAll(params: GetClassesParams = {}): Promise<PaginatedResponse<ClassEntity>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
    // company_id is automatically filtered by backend from JWT token, no need to send it
    if (params.program_id) qp.append('program_id', String(params.program_id));
    if (params.specialization_id) qp.append('specialization_id', String(params.specialization_id));
    if (params.level_id) qp.append('level_id', String(params.level_id));
    if (params.school_year_id) qp.append('school_year_id', String(params.school_year_id));
    if (params.school_year_period_id) qp.append('school_year_period_id', String(params.school_year_period_id));
    if (params.student_id) qp.append('student_id', String(params.student_id));
    const qs = qp.toString();
    const url = qs ? `/classes?${qs}` : '/classes';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<ClassEntity> {
    const { data } = await api.get(`/classes/${id}`);
    return data;
  },

  async create(payload: CreateClassRequest): Promise<ClassEntity> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId({
      status: 1,
      ...payload,
    });
    const bodyWithDefaults = body as CreateClassRequest & { status?: number };
    if (bodyWithDefaults.status === undefined || bodyWithDefaults.status === null) {
      bodyWithDefaults.status = 1;
    }
    const { data } = await api.post('/classes', body);
    return data;
  },

  async update(id: number, payload: UpdateClassRequest): Promise<ClassEntity> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/classes/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/classes/${id}`);
  },
};

export default classesApi;

