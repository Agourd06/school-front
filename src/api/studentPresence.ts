import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export type PresenceValue = 'present' | 'absent' | 'late' | 'excused';
export type StudentPresenceStatus = -2 | -1 | 0 | 1 | 2;

export interface StudentPresenceStudent {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface StudentPresenceTeacher {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface StudentPresenceCourse {
  id: number;
  title?: string | null;
  coefficient?: number | null;
}

export interface StudentPresencePlanning {
  id: number;
  period?: string | null;
  date_day?: string | null;
  hour_start?: string | null;
  hour_end?: string | null;
  class_id?: number | null;
  class_room_id?: number | null;
  teacher_id?: number | null;
  course_id?: number | null;
  course?: StudentPresenceCourse | null;
  teacher?: StudentPresenceTeacher | null;
}

export interface StudentPresenceCompany {
  id: number;
  name?: string | null;
}

export interface StudentPresence {
  id: number;
  student_planning_id: number;
  student_id: number;
  presence: PresenceValue;
  note: number;
  remarks?: string | null;
  validate_report?: boolean | null;
  company_id?: number | null;
  status: StudentPresenceStatus;
  created_at?: string;
  updated_at?: string;
  student?: StudentPresenceStudent | null;
  studentPlanning?: StudentPresencePlanning | null;
  company?: StudentPresenceCompany | null;
}

export interface CreateStudentPresencePayload {
  student_planning_id: number;
  student_id: number;
  presence?: PresenceValue;
  note?: number;
  remarks?: string | null;
  company_id?: number | null; // Optional - backend sets it from authenticated user
  status?: StudentPresenceStatus;
}

export type UpdateStudentPresencePayload = Partial<CreateStudentPresencePayload>;

export interface GetStudentPresenceParams extends PaginationParams {
  status?: StudentPresenceStatus;
  student_id?: number;
  student_planning_id?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

type RawPresenceResponse = {
  data?: StudentPresence[];
  meta?: Partial<PaginatedResponse<StudentPresence>['meta']> & {
    lastPage?: number;
  };
};

const toPaginated = (raw: unknown): PaginatedResponse<StudentPresence> => {
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

  const data = (raw as RawPresenceResponse)?.data ?? [];
  const meta = (raw as RawPresenceResponse)?.meta ?? {};
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

const buildQueryString = (params: GetStudentPresenceParams = {}): string => {
  const qp = new URLSearchParams();

  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.student_id) qp.append('student_id', String(params.student_id));
  if (params.student_planning_id) qp.append('student_planning_id', String(params.student_planning_id));

  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const studentPresenceApi = {
  async getAll(params: GetStudentPresenceParams = {}): Promise<PaginatedResponse<StudentPresence>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/student-presence${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<StudentPresence> {
    const { data } = await api.get(`/student-presence/${id}`);
    return data;
  },

  async create(payload: CreateStudentPresencePayload): Promise<StudentPresence> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify student and student planning belong to the same company
    const body = ensureCompanyId({
      ...payload,
      presence: payload.presence ?? 'absent',
      note: payload.note ?? -1,
      status: payload.status ?? 2,
    });
    const { data } = await api.post('/student-presence', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentPresencePayload): Promise<StudentPresence> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating student or student planning, backend will verify they belong to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/student-presence/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/student-presence/${id}`);
  },
};

export default studentPresenceApi;

