import api from './axios';

export type Administrator = {
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

export type GetAllAdministratorsParams = {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  class_room_id?: number;
};

export type CreateAdministratorRequest = Omit<Administrator, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAdministratorRequest = Partial<CreateAdministratorRequest>;

export const administratorsApi = {
  async getAll(params: GetAllAdministratorsParams = {}): Promise<Paginated<Administrator>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (typeof params.company_id === 'number') qp.append('company_id', String(params.company_id));
    if (typeof params.class_room_id === 'number') qp.append('class_room_id', String(params.class_room_id));
    const qs = qp.toString();
    const url = qs ? `/administrators?${qs}` : '/administrators';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<Administrator> {
    const response = await api.get(`/administrators/${id}`);
    return response.data;
  },

  async create(data: CreateAdministratorRequest): Promise<Administrator> {
    const response = await api.post('/administrators', data);
    return response.data;
  },

  async update(id: number, data: UpdateAdministratorRequest): Promise<Administrator> {
    const response = await api.patch(`/administrators/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/administrators/${id}`);
  },
};

export default administratorsApi;


