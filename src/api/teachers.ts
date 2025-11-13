import api from './axios';

export type Teacher = {
  id: number;
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
  company?: {
    id: number;
    name?: string | null;
  } | null;
  class_room_id?: number;
  status?: number;

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

export type GetAllTeachersParams = {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  class_room_id?: number;
  status?: number;
};

export type CreateTeacherRequest = Omit<Teacher, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTeacherRequest = Partial<CreateTeacherRequest>;

export const teachersApi = {
  async getAll(params: GetAllTeachersParams = {}): Promise<Paginated<Teacher>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (typeof params.company_id === 'number') qp.append('company_id', String(params.company_id));
    if (typeof params.class_room_id === 'number') qp.append('class_room_id', String(params.class_room_id));
    if (typeof params.status === 'number') qp.append('status', String(params.status));
    const qs = qp.toString();
    const url = qs ? `/teachers?${qs}` : '/teachers';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<Teacher> {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  async create(data: CreateTeacherRequest | FormData): Promise<Teacher> {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  async update(id: number, data: UpdateTeacherRequest | FormData): Promise<Teacher> {
    const response = await api.patch(`/teachers/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },
};

export default teachersApi;


