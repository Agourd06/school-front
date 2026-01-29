import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';
import type { Teacher } from './teachers';
import type { Course } from './courses';

export type TeacherCourseStatus = -2 | -1 | 0 | 1 | 2;

export interface TeacherCourse {
  teacher_id: number;
  course_id: number;
  status: TeacherCourseStatus;
  teacher?: Teacher;
  course?: Course;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTeacherCoursePayload {
  teacher_id: number;
  course_id: number;
  status?: TeacherCourseStatus;
}

export type UpdateTeacherCoursePayload = Partial<Pick<CreateTeacherCoursePayload, 'status'>>;

export interface GetTeacherCourseParams extends PaginationParams {
  teacher_id?: number;
  course_id?: number;
  status?: TeacherCourseStatus;
}

const toPaginated = (raw: unknown): PaginatedResponse<TeacherCourse> => {
  if (Array.isArray(raw)) {
    return {
      data: raw as TeacherCourse[],
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
    data?: TeacherCourse[];
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

const buildQueryString = (params: GetTeacherCourseParams = {}): string => {
  const qp = new URLSearchParams();
  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.teacher_id) qp.append('teacher_id', String(params.teacher_id));
  if (params.course_id) qp.append('course_id', String(params.course_id));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const teacherCourseApi = {
  async getAll(params: GetTeacherCourseParams = {}): Promise<PaginatedResponse<TeacherCourse>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/teacher-course${qs}`);
    return toPaginated(data);
  },

  async getById(teacherId: number, courseId: number): Promise<TeacherCourse> {
    const { data } = await api.get(`/teacher-course/${teacherId}/${courseId}`);
    return data;
  },

  async getTeachersByCourse(courseId: number): Promise<Teacher[]> {
    const { data } = await api.get(`/teacher-course/course/${courseId}/teachers`);
    return data;
  },

  async create(payload: CreateTeacherCoursePayload): Promise<TeacherCourse> {
    const body = {
      status: payload.status ?? 1,
      ...payload,
    };
    const { data } = await api.post('/teacher-course', body);
    return data;
  },

  async update(teacherId: number, courseId: number, payload: UpdateTeacherCoursePayload): Promise<TeacherCourse> {
    const { data } = await api.patch(`/teacher-course/${teacherId}/${courseId}`, payload);
    return data;
  },

  async delete(teacherId: number, courseId: number): Promise<void> {
    await api.delete(`/teacher-course/${teacherId}/${courseId}`);
  },
};

export default teacherCourseApi;
