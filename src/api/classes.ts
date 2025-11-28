import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';

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
  const rawObj = raw as { data?: ClassEntity[]; meta?: { page?: number; limit?: number; total?: number; totalPages?: number; lastPage?: number; hasNext?: boolean; hasPrevious?: boolean } };
  const meta = rawObj?.meta || {};
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(rawObj?.data) ? rawObj.data.length : 10);
  return {
    data: rawObj?.data || [],
    meta: {
      page,
      limit,
      total: meta.total ?? (Array.isArray(rawObj?.data) ? rawObj.data.length : 0),
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
    // company_id is automatically set by backend from authenticated user - DO NOT send it
    const { company_id: _companyId, ...rest } = payload;
    void _companyId;
    const body: CreateClassRequest = {
      status: 1,
      ...rest,
    };
    if (body.status === undefined || body.status === null) {
      body.status = 1;
    }
    const { data } = await api.post('/classes', body);
    return data;
  },

  async update(id: number, payload: UpdateClassRequest): Promise<ClassEntity> {
    // company_id is automatically set by backend from authenticated user - DO NOT send it
    const { company_id: _companyId, ...rest } = payload;
    void _companyId;
    const { data } = await api.patch(`/classes/${id}`, rest);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/classes/${id}`);
  },
};

export default classesApi;

