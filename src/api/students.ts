import api from './axios';

export type Student = {
  id: number;
  code: string;
  gender?: string;
  first_name: string;
  last_name: string;
  birthday?: string; // YYYY-MM-DD
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  picture?: string;
  company_id?: number;
  class_room_id?: number;
  classRoom?: {
    id: number;
    code: string;
    title: string;
    capacity: number;
  } | null;
  class_room?: {
    id: number;
    code: string;
    title: string;
    capacity: number;
  } | null;
  created_at: string;
  updated_at: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export type GetAllStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  class_room_id?: number;
};

export type CreateStudentRequest = Omit<Student, 'id' | 'created_at' | 'updated_at'>;
export type UpdateStudentRequest = Partial<CreateStudentRequest>;

export const studentsApi = {
  async getAll(params: GetAllStudentsParams = {}): Promise<Paginated<Student>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (typeof params.company_id === 'number') qp.append('company_id', String(params.company_id));
    if (typeof params.class_room_id === 'number') qp.append('class_room_id', String(params.class_room_id));
    const qs = qp.toString();
    const url = qs ? `/students?${qs}` : '/students';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<Student> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async create(data: CreateStudentRequest): Promise<Student> {
    const response = await api.post('/students', data);
    return response.data;
  },

  async update(id: number, data: UpdateStudentRequest): Promise<Student> {
    const response = await api.patch(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
  },
};

export default studentsApi;


