import api from './axios';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface StudentDiplome {
  id: number;
  title: string;
  school: string;
  diplome?: string;
  annee?: number;
  country?: string;
  city?: string;
  student_id: number;
  diplome_picture_1?: string | null;
  diplome_picture_2?: string | null;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentDiplomeRequest {
  title: string;
  school: string;
  diplome?: string;
  annee?: number | string;
  country?: string;
  city?: string;
  student_id: number | string;
  diplome_picture_1?: File | null;
  diplome_picture_2?: File | null;
  company_id?: number | string; // Optional - backend sets it from authenticated user
  status?: number | string; // -2,-1,0,1,2
}

export type UpdateStudentDiplomeRequest = Partial<CreateStudentDiplomeRequest>;

export interface GetAllStudentDiplomeParams {
  page?: number;
  limit?: number;
  search?: string;
  student_id?: number | string;
  annee?: number | string;
  status?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

const buildFormData = (payload: Partial<CreateStudentDiplomeRequest>) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'diplome_picture_1' || key === 'diplome_picture_2') {
      if (value instanceof File) fd.append(key, value);
    } else {
      fd.append(key, String(value));
    }
  });
  return fd;
};

export const studentDiplomeApi = {
  async getAll(params: GetAllStudentDiplomeParams = {}): Promise<{ data: StudentDiplome[]; meta: { page?: number; limit?: number; total?: number; totalPages?: number; hasNext?: boolean; hasPrevious?: boolean } }> {
    const { data } = await api.get('/student-diplome', { params });
    return data;
  },
  async getById(id: number): Promise<StudentDiplome> {
    const { data } = await api.get(`/student-diplome/${id}`);
    return data;
  },
  async create(payload: CreateStudentDiplomeRequest): Promise<StudentDiplome> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify the student belongs to the same company
    const fd = buildFormData(payload);
    ensureCompanyId(fd); // ensureCompanyId handles FormData correctly
    const { data } = await api.post('/student-diplome', fd);
    return data;
  },
  async update(id: number, payload: UpdateStudentDiplomeRequest): Promise<StudentDiplome> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating student_id, backend will verify the new student belongs to the same company
    const fd = buildFormData(payload);
    ensureCompanyId(fd); // ensureCompanyId handles FormData correctly
    const { data } = await api.patch(`/student-diplome/${id}`, fd);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/student-diplome/${id}`);
  },
};


