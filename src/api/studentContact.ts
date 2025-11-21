import api from './axios';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface StudentContact {
  id: number;
  firstname: string;
  lastname: string;
  birthday?: string;
  email?: string;
  phone?: string;
  adress?: string;
  city?: string;
  country?: string;
  student_id?: number;
  studentlinktypeId?: number | string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentContactRequest {
  firstname: string;
  lastname: string;
  birthday?: string;
  email?: string;
  phone?: string;
  adress?: string;
  city?: string;
  country?: string;
  student_id?: number;
  studentlinktypeId?: number | string;
  company_id?: number; // Optional - backend sets it from authenticated user
  status?: number; // -2,-1,0,1,2
}

export type UpdateStudentContactRequest = Partial<CreateStudentContactRequest>;

export interface GetAllStudentContactParams {
  page?: number;
  limit?: number;
  search?: string;
  studentlinktypeId?: number | string;
  status?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

export const studentContactApi = {
  async getAll(params: GetAllStudentContactParams = {}): Promise<{ data: StudentContact[]; meta: { page?: number; limit?: number; total?: number; totalPages?: number; hasNext?: boolean; hasPrevious?: boolean } }> {
    const { data } = await api.get('/student-contact', { params });
    return data;
  },
  async getById(id: number): Promise<StudentContact> {
    const { data } = await api.get(`/student-contact/${id}`);
    return data;
  },
  async create(payload: CreateStudentContactRequest): Promise<StudentContact> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify the student belongs to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.post('/student-contact', body);
    return data;
  },
  async update(id: number, payload: UpdateStudentContactRequest): Promise<StudentContact> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating student_id, backend will verify the new student belongs to the same company
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/student-contact/${id}`, body);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/student-contact/${id}`);
  },
};


