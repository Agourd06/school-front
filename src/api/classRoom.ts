import api from './axios';

export type ClassRoom = {
  id: number;
  code: string;
  title: string;
  capacity: number;
  company_id?: number;
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

export type GetAllClassRoomsParams = {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
};

export type CreateClassRoomRequest = {
  code: string;
  title: string;
  capacity: number;
  company_id?: number;
};

export type UpdateClassRoomRequest = Partial<CreateClassRoomRequest>;

export const classRoomApi = {
  async getAll(params: GetAllClassRoomsParams = {}): Promise<Paginated<ClassRoom>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', params.page.toString());
    if (params.limit) qp.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (typeof params.company_id === 'number') qp.append('company_id', String(params.company_id));
    const qs = qp.toString();
    const url = qs ? `/class-rooms?${qs}` : '/class-rooms';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<ClassRoom> {
    const response = await api.get(`/class-rooms/${id}`);
    return response.data;
  },

  async create(data: CreateClassRoomRequest): Promise<ClassRoom> {
    const response = await api.post('/class-rooms', data);
    return response.data;
  },

  async update(id: number, data: UpdateClassRoomRequest): Promise<ClassRoom> {
    const response = await api.patch(`/class-rooms/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/class-rooms/${id}`);
  },
};

export default classRoomApi;


