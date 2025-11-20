import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import type { PlanningStatus } from '../constants/planning';
import type { PlanningSessionType } from './planningSessionType';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface PlanningTeacher {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface PlanningClass {
  id: number;
  title?: string | null;
}

export interface PlanningClassRoom {
  id: number;
  title?: string | null;
}

export interface PlanningSpecialization {
  id: number;
  title?: string | null;
}

export interface PlanningCompany {
  id: number;
  name?: string | null;
}

export interface PlanningCourse {
  id: number;
  title?: string | null;
}

export interface PlanningStudentEntry {
  id: number;
  period: string;
  date_day: string; // YYYY-MM-DD
  hour_start: string; // HH:mm
  hour_end: string; // HH:mm
  status: PlanningStatus;
  teacher_id: number;
  specialization_id: number;
  class_id: number;
  class_room_id: number;
  planning_session_type_id: number;
  course_id: number;
  company_id?: number | null;
  school_year_id?: number | null;
  teacher?: PlanningTeacher | null;
  specialization?: PlanningSpecialization | null;
  class?: PlanningClass | null;
  classRoom?: PlanningClassRoom | null;
  company?: PlanningCompany | null;
  planningSessionType?: PlanningSessionType | null;
  course?: PlanningCourse | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlanningStudentPayload {
  period: string;
  teacher_id: number;
  specialization_id: number;
  class_id: number;
  class_room_id: number;
  planning_session_type_id: number;
  course_id: number;
  date_day: string;
  hour_start: string;
  hour_end: string;
  school_year_id?: number | null;
  status?: PlanningStatus;
}

export type UpdatePlanningStudentPayload = Partial<PlanningStudentPayload>;

export interface GetPlanningStudentParams extends PaginationParams {
  status?: PlanningStatus;
  class_id?: number;
  class_room_id?: number;
  teacher_id?: number;
  specialization_id?: number;
  planning_session_type_id?: number;
  course_id?: number;
  order?: 'ASC' | 'DESC';
  // company_id is automatically filtered by backend from JWT, no need to send it
}

type RawPlanningResponse = {
  data?: PlanningStudentEntry[];
  meta?: Partial<PaginatedResponse<PlanningStudentEntry>['meta']>;
};

const toPaginated = (raw: unknown): PaginatedResponse<PlanningStudentEntry> => {
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

  const meta = (raw as RawPlanningResponse)?.meta || {};
  const data = (raw as RawPlanningResponse)?.data || [];
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

const buildQueryString = (params: GetPlanningStudentParams = {}): string => {
  const qp = new URLSearchParams();

  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.class_id) qp.append('class_id', String(params.class_id));
  if (params.class_room_id) qp.append('class_room_id', String(params.class_room_id));
  if (params.teacher_id) qp.append('teacher_id', String(params.teacher_id));
  if (params.specialization_id) qp.append('specialization_id', String(params.specialization_id));
  if (params.planning_session_type_id) qp.append('planning_session_type_id', String(params.planning_session_type_id));
  if (params.course_id) qp.append('course_id', String(params.course_id));
  if (params.order) qp.append('order', params.order);

  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const planningStudentApi = {
  async getAll(params: GetPlanningStudentParams = {}): Promise<PaginatedResponse<PlanningStudentEntry>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/students-plannings${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<PlanningStudentEntry> {
    const { data } = await api.get(`/students-plannings/${id}`);
    return data;
  },

  async create(payload: PlanningStudentPayload): Promise<PlanningStudentEntry> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify all related entities (teacher, specialization, class, class room, planning session type, school year) belong to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.post('/students-plannings', body);
    return data;
  },

  async update(id: number, payload: UpdatePlanningStudentPayload): Promise<PlanningStudentEntry> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating related entities, backend will verify they belong to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/students-plannings/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/students-plannings/${id}`);
  },
};

export default planningStudentApi;

