import api from './axios';
import type { PaginatedResponse, PaginationParams } from '../types/api';

export type StudentPaymentStatus = -2 | -1 | 0 | 1 | 2;

export interface StudentPaymentStudent {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface StudentPaymentSchoolYear {
  id: number;
  title?: string | null;
}

export interface StudentPaymentLevel {
  id: number;
  title?: string | null;
}

export interface StudentPaymentLevelPricing {
  id: number;
  title?: string | null;
  amount?: string | null;
}

export interface StudentPaymentCompany {
  id: number;
  name?: string | null;
}

export interface StudentPayment {
  id: number;
  student_id: number;
  school_year_id: number;
  level_id: number;
  level_pricing_id?: number | null;
  amount: string;
  payment: string;
  date: string;
  mode: string;
  reference?: string | null;
  company_id?: number | null;
  status: StudentPaymentStatus;
  created_at?: string;
  updated_at?: string;
  student?: StudentPaymentStudent | null;
  schoolYear?: StudentPaymentSchoolYear | null;
  level?: StudentPaymentLevel | null;
  levelPricing?: StudentPaymentLevelPricing | null;
  company?: StudentPaymentCompany | null;
}

export interface CreateStudentPaymentPayload {
  student_id: number;
  school_year_id: number;
  level_id: number;
  level_pricing_id?: number | null;
  amount: number;
  payment: number;
  date: string;
  mode: string;
  reference?: string | null;
  company_id?: number | null;
  status?: StudentPaymentStatus;
}

export type UpdateStudentPaymentPayload = Partial<CreateStudentPaymentPayload>;

export interface GetStudentPaymentParams extends PaginationParams {
  status?: StudentPaymentStatus;
  student_id?: number;
  school_year_id?: number;
  level_id?: number;
  level_pricing_id?: number;
  date?: string;
  mode?: string;
  search?: string;
}

const toPaginated = (raw: any): PaginatedResponse<StudentPayment> => {
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

const buildQueryString = (params: GetStudentPaymentParams = {}): string => {
  const qp = new URLSearchParams();

  if (params.page) qp.append('page', String(params.page));
  if (params.limit) qp.append('limit', String(params.limit));
  if (params.status !== undefined && params.status !== null) qp.append('status', String(params.status));
  if (params.student_id) qp.append('student_id', String(params.student_id));
  if (params.school_year_id) qp.append('school_year_id', String(params.school_year_id));
  if (params.level_id) qp.append('level_id', String(params.level_id));
  if (params.level_pricing_id) qp.append('level_pricing_id', String(params.level_pricing_id));
  if (params.date) qp.append('date', params.date);
  if (params.mode) qp.append('mode', params.mode);
  if (params.search) qp.append('search', params.search);

  const qs = qp.toString();
  return qs ? `?${qs}` : '';
};

export const studentPaymentApi = {
  async getAll(params: GetStudentPaymentParams = {}): Promise<PaginatedResponse<StudentPayment>> {
    const qs = buildQueryString(params);
    const { data } = await api.get(`/student-payments${qs}`);
    return toPaginated(data);
  },

  async getById(id: number): Promise<StudentPayment> {
    const { data } = await api.get(`/student-payments/${id}`);
    return data;
  },

  async create(payload: CreateStudentPaymentPayload): Promise<StudentPayment> {
    const body = {
      status: 2,
      ...payload,
    };
    const { data } = await api.post('/student-payments', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentPaymentPayload): Promise<StudentPayment> {
    const { data } = await api.patch(`/student-payments/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/student-payments/${id}`);
  },
};

export default studentPaymentApi;


