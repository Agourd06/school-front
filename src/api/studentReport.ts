import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import type { PlanningStudentEntry } from './planningStudent';
import type { StudentPresence } from './studentPresence';

export type StudentReportStatus = -2 | -1 | 0 | 1 | 2;

export interface StudentSummary {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  picture?: string | null;
  status?: number | null;
}

export interface SchoolYearPeriodSummary {
  id: number;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface SchoolYearSummary {
  id: number;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface StudentReport {
  id: number;
  school_year_id: number;
  school_year_period_id: number;
  student_id: number;
  remarks?: string | null;
  mention?: string | null;
  passed: boolean;
  status: StudentReportStatus;
  created_at?: string;
  updated_at?: string;
  student?: StudentSummary | null;
  period?: SchoolYearPeriodSummary | null;
  year?: SchoolYearSummary | null;
}

export interface StudentReportDashboardFilters {
  class_id: number;
  school_year_id: number;
  school_year_period_id: number;
  period_label?: string | null;
  student_id?: number | null;
  course_id?: number | null;
  teacher_id?: number | null;
}

export interface StudentReportDashboardStudent {
  student_id: number;
  student?: StudentSummary | null;
  report?: StudentReport | null;
}

export interface StudentReportDashboardResponse {
  filters: StudentReportDashboardFilters;
  students: StudentReportDashboardStudent[];
  sessions: PlanningStudentEntry[];
  presences: StudentPresence[];
}

export interface StudentReportDashboardParams {
  class_id: number;
  school_year_id: number;
  school_year_period_id: number;
  period_label?: string;
  student_id?: number;
  course_id?: number;
  teacher_id?: number;
}

export interface CreateStudentReportPayload {
  school_year_id: number;
  school_year_period_id: number;
  student_id: number;
  remarks?: string | null;
  mention?: string | null;
  passed?: boolean;
  status?: StudentReportStatus;
  // Note: This entity doesn't have a direct company_id column
  // Backend filters by student.company_id from the authenticated user's JWT
}

export type UpdateStudentReportPayload = Partial<CreateStudentReportPayload>;

export interface GetStudentReportsParams extends PaginationParams {
  status?: StudentReportStatus;
  student_id?: number;
  school_year_period_id?: number;
  school_year_id?: number;
  passed?: boolean;
}

type RawStudentReportResponse = {
  data?: StudentReport[];
  meta?: Partial<PaginatedResponse<StudentReport>['meta']>;
};

const toPaginated = (raw: unknown): PaginatedResponse<StudentReport> => {
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

  const data = (raw as RawStudentReportResponse)?.data ?? [];
  const meta = (raw as RawStudentReportResponse)?.meta ?? {};
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

const buildQueryString = (params: GetStudentReportsParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.student_id) qp.append('student_id', String(params.student_id));
  if (params.school_year_period_id) qp.append('school_year_period_id', String(params.school_year_period_id));
  if (params.school_year_id) qp.append('school_year_id', String(params.school_year_id));
  if (params.passed !== undefined && params.passed !== null) qp.append('passed', String(params.passed));
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

const buildDashboardQueryString = (params: StudentReportDashboardParams): string => {
  const qp = new URLSearchParams();
  qp.append('class_id', String(params.class_id));
  qp.append('school_year_id', String(params.school_year_id));
  qp.append('school_year_period_id', String(params.school_year_period_id));
  if (params.period_label) qp.append('period_label', params.period_label);
  if (params.student_id) qp.append('student_id', String(params.student_id));
  if (params.course_id) qp.append('course_id', String(params.course_id));
  if (params.teacher_id) qp.append('teacher_id', String(params.teacher_id));
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const studentReportApi = {
  async getAll(params: GetStudentReportsParams = {}): Promise<PaginatedResponse<StudentReport>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/student-reports${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<StudentReport> {
    const { data } = await api.get(`/student-reports/${id}`);
    return data;
  },

  async create(payload: CreateStudentReportPayload): Promise<StudentReport> {
    const status = payload.status ?? 2;
    const body = {
      ...payload,
      passed: payload.passed ?? false,
      status,
    };
    const { data } = await api.post('/student-reports', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentReportPayload): Promise<StudentReport> {
    const { data } = await api.patch(`/student-reports/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/student-reports/${id}`);
  },

  async getDashboard(params: StudentReportDashboardParams): Promise<StudentReportDashboardResponse> {
    const qs = buildDashboardQueryString(params);
    const { data } = await api.get(`/student-reports/dashboard${qs}`);
    return data;
  },
};

export default studentReportApi;


