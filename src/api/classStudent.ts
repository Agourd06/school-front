import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { DEFAULT_COMPANY_ID } from '../constants/status';

export interface MinimalStudent {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: number;
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
  company_id?: number;
  status?: number;
  tri?: number;
}

export type UpdateClassStudentRequest = Partial<CreateClassStudentRequest>;

export interface GetClassStudentParams extends FilterParams {
  class_id?: number;
  student_id?: number;
  company_id?: number;
}

const toPaginated = (raw: any): PaginatedResponse<ClassStudentAssignment> => {
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

const buildQueryString = (params: GetClassStudentParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.search && params.search.trim()) qp.append('search', params.search.trim());
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (typeof params.class_id === 'number') qp.append('class_id', String(params.class_id));
  if (typeof params.student_id === 'number') qp.append('student_id', String(params.student_id));
  if (typeof params.company_id === 'number') qp.append('company_id', String(params.company_id));
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
    const body: CreateClassStudentRequest = {
      status: 1,
      tri: 1,
      company_id: DEFAULT_COMPANY_ID,
      ...payload,
    };

    if (body.tri === undefined || body.tri === null) body.tri = 1;
    if (body.tri < 1) body.tri = 1;
    if (body.status === undefined || body.status === null) body.status = 1;
    if (body.company_id === undefined || body.company_id === null) body.company_id = DEFAULT_COMPANY_ID;

    const { data } = await api.post('/class-student', body);
    return data;
  },

  async update(id: number, payload: UpdateClassStudentRequest): Promise<ClassStudentAssignment> {
    const body: UpdateClassStudentRequest = { ...payload };
    const { data } = await api.patch(`/class-student/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/class-student/${id}`);
  },
};

export default classStudentApi;


