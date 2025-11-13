import api from './axios';

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
  company_id?: number;
  status?: number; // -2,-1,0,1,2
}

export type UpdateStudentContactRequest = Partial<CreateStudentContactRequest>;

export interface GetAllStudentContactParams {
  page?: number;
  limit?: number;
  search?: string;
  studentlinktypeId?: number | string;
  status?: number;
}

export const studentContactApi = {
  async getAll(params: GetAllStudentContactParams = {}): Promise<{ data: StudentContact[]; meta: any }> {
    const { data } = await api.get('/student-contact', { params });
    return data;
  },
  async getById(id: number): Promise<StudentContact> {
    const { data } = await api.get(`/student-contact/${id}`);
    return data;
  },
  async create(payload: CreateStudentContactRequest): Promise<StudentContact> {
    const { data } = await api.post('/student-contact', payload);
    return data;
  },
  async update(id: number, payload: UpdateStudentContactRequest): Promise<StudentContact> {
    const { data } = await api.patch(`/student-contact/${id}`, payload);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/student-contact/${id}`);
  },
};


