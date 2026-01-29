import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';

export type ClassCourseStatus = -2 | -1 | 0 | 1 | 2;

export interface ClassSummary {
  id: number;
  title?: string | null;
}

export interface ModuleSummary {
  id: number;
  title?: string | null;
}

export interface CourseSummary {
  id: number;
  title?: string | null;
}

export interface TeacherSummary {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface LevelSummary {
  id: number;
  title?: string | null;
  description?: string | null;
  specialization?: {
    id: number;
    title?: string | null;
    program?: {
      id: number;
      title?: string | null;
    };
  };
}

export interface ClassCourse {
  id: number;
  title: string;
  description?: string | null;
  status: ClassCourseStatus;
  level_id: number;
  level?: LevelSummary | null;
  module_id: number;
  module?: ModuleSummary | null;
  course_id: number;
  course?: CourseSummary | null;
  volume?: number | null;
  duration?: number | null;
  company_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassCoursePayload {
  title?: string; // Optional - can be auto-generated
  description?: string | null;
  status?: ClassCourseStatus;
  level_id: number;
  module_id: number;
  course_id: number;
  volume?: number | null;
  duration?: number | null;
}

// Batch creation endpoint removed - no longer supported

export type UpdateClassCoursePayload = Partial<CreateClassCoursePayload>;

export interface GetClassCourseParams extends PaginationParams {
  search?: string;
  status?: ClassCourseStatus;
  level_id?: number;
  module_id?: number;
  course_id?: number;
}

const toPaginated = (raw: unknown): PaginatedResponse<ClassCourse> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as ClassCourse[],
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

  const rawObj = raw as {
    data?: ClassCourse[];
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      lastPage?: number;
      hasNext?: boolean;
      hasPrevious?: boolean;
    };
  };

  const data = Array.isArray(rawObj?.data) ? rawObj.data : [];
  const meta = rawObj?.meta ?? {};
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (data.length > 0 ? data.length : 10);
  const total = meta.total ?? data.length;
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

const buildQueryString = (params: GetClassCourseParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.search && params.search.trim()) qp.append('search', params.search.trim());
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.level_id) qp.append('level_id', String(params.level_id));
  if (params.module_id) qp.append('module_id', String(params.module_id));
  if (params.course_id) qp.append('course_id', String(params.course_id));
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const classCourseApi = {
  async getAll(params: GetClassCourseParams = {}): Promise<PaginatedResponse<ClassCourse>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/class-course${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<ClassCourse> {
    const { data } = await api.get(`/class-course/${id}`);
    return data;
  },

  async create(payload: CreateClassCoursePayload): Promise<ClassCourse> {
    const body = {
      status: payload.status ?? 2, // Default to pending (2) for new entries
      ...payload,
    };
    const { data } = await api.post('/class-course', body);
    return data;
  },

  async update(id: number, payload: UpdateClassCoursePayload): Promise<ClassCourse> {
    const { data } = await api.patch(`/class-course/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/class-course/${id}`);
  },
};

export default classCourseApi;


