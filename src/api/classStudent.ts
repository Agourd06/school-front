import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface MinimalStudent {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: number;
  picture?: string | null;
}

export interface MinimalClass {
  id: number;
  title?: string;
  status?: number;
}

export interface MinimalCompany {
  id: number;
  title?: string;
  name?: string;
  status?: number;
}

export interface ClassStudentAssignment {
  id: number;
  status: number;
  tri: number;
  class_id: number;
  student_id: number;
  company_id?: number | null;
  class?: MinimalClass | null;
  student?: MinimalStudent | null;
  company?: MinimalCompany | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassStudentRequest {
  class_id: number;
  student_id: number;
  company_id?: number; // Optional - backend sets it from authenticated user
  status?: number;
  tri?: number;
}

export type UpdateClassStudentRequest = Partial<CreateClassStudentRequest>;

export interface GetClassStudentParams extends FilterParams {
  class_id?: number;
  student_id?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

const toPaginated = (raw: unknown): PaginatedResponse<ClassStudentAssignment> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as ClassStudentAssignment[],
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

  const rawObj = raw as { meta?: { page?: number; limit?: number; total?: number; totalPages?: number; lastPage?: number; hasNext?: boolean; hasPrevious?: boolean }; data?: ClassStudentAssignment[] };
  const meta = rawObj?.meta || {};
  const data = rawObj?.data || [];
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(data) ? data.length : 10);
  const total = meta.total ?? (Array.isArray(data) ? data.length : 0);
  const totalPages = meta.totalPages ?? meta.lastPage ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return {
    data: Array.isArray(data) ? data : [],
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

const buildQueryString = (params: GetClassStudentParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.search && params.search.trim()) qp.append('search', params.search.trim());
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (typeof params.class_id === 'number') qp.append('class_id', String(params.class_id));
  if (typeof params.student_id === 'number') qp.append('student_id', String(params.student_id));
  // company_id is automatically filtered by backend from JWT token, no need to send it
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const classStudentApi = {
  async getAll(params: GetClassStudentParams = {}): Promise<PaginatedResponse<ClassStudentAssignment>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/class-student${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<ClassStudentAssignment> {
    const { data } = await api.get(`/class-student/${id}`);
    return data;
  },

  async create(payload: CreateClassStudentRequest): Promise<ClassStudentAssignment> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId({
      status: 1,
      tri: 1,
      ...payload,
    });

    const bodyWithDefaults = body as CreateClassStudentRequest & { tri?: number; status?: number };
    if (bodyWithDefaults.tri === undefined || bodyWithDefaults.tri === null) bodyWithDefaults.tri = 1;
    if (bodyWithDefaults.tri < 1) bodyWithDefaults.tri = 1;
    if (bodyWithDefaults.status === undefined || bodyWithDefaults.status === null) bodyWithDefaults.status = 1;

    const { data } = await api.post('/class-student', body);
    return data;
  },

  async update(id: number, payload: UpdateClassStudentRequest): Promise<ClassStudentAssignment> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/class-student/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/class-student/${id}`);
  },
};

export default classStudentApi;


