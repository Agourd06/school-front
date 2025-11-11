import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import type { StudentReport } from './studentReport';

export type StudentReportDetailStatus = -2 | -1 | 0 | 1 | 2;

export interface TeacherSummary {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface CourseSummary {
  id: number;
  title?: string | null;
  code?: string | null;
}

export interface StudentReportDetail {
  id: number;
  student_report_id: number;
  teacher_id: number;
  course_id: number;
  remarks?: string | null;
  status: StudentReportDetailStatus;
  created_at?: string;
  updated_at?: string;
  studentReport?: StudentReport | null;
  teacher?: TeacherSummary | null;
  course?: CourseSummary | null;
}

export interface CreateStudentReportDetailPayload {
  student_report_id: number;
  teacher_id: number;
  course_id: number;
  remarks?: string | null;
  status?: StudentReportDetailStatus;
}

export type UpdateStudentReportDetailPayload = Partial<CreateStudentReportDetailPayload>;

export interface GetStudentReportDetailsParams extends PaginationParams {
  student_report_id?: number;
  teacher_id?: number;
  course_id?: number;
  status?: StudentReportDetailStatus;
}

const toPaginated = (raw: any): PaginatedResponse<StudentReportDetail> => {
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

  const data = raw?.data ?? [];
  const meta = raw?.meta ?? {};
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

const buildQueryString = (params: GetStudentReportDetailsParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.student_report_id) qp.append('student_report_id', String(params.student_report_id));
  if (params.teacher_id) qp.append('teacher_id', String(params.teacher_id));
  if (params.course_id) qp.append('course_id', String(params.course_id));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const studentReportDetailApi = {
  async getAll(params: GetStudentReportDetailsParams = {}): Promise<PaginatedResponse<StudentReportDetail>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/student-report-details${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<StudentReportDetail> {
    const { data } = await api.get(`/student-report-details/${id}`);
    return data;
  },

  async create(payload: CreateStudentReportDetailPayload): Promise<StudentReportDetail> {
    const status = payload.status ?? 2;
    const body = {
      ...payload,
      status,
    };
    const { data } = await api.post('/student-report-details', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentReportDetailPayload): Promise<StudentReportDetail> {
    const { data } = await api.patch(`/student-report-details/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/student-report-details/${id}`);
  },
};

export default studentReportDetailApi;


