import api from './axios';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface ClassroomType {
  id: number;
  title: string;
  status?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassroomTypeRequest {
  title: string;
  company_id?: number; // Optional - backend sets it from authenticated user
  status?: number; // -2,-1,0,1,2
}

export type UpdateClassroomTypeRequest = Partial<CreateClassroomTypeRequest>;

export interface GetAllClassroomTypeParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

export const classroomTypeApi = {
  async getAll(params: GetAllClassroomTypeParams = {}): Promise<{ data: ClassroomType[]; meta: { page?: number; limit?: number; total?: number; totalPages?: number; hasNext?: boolean; hasPrevious?: boolean } }> {
    const { data } = await api.get('/classroom-types', { params });
    return data;
  },

  async getById(id: number): Promise<ClassroomType> {
    const { data } = await api.get(`/classroom-types/${id}`);
    return data;
  },

  async create(payload: CreateClassroomTypeRequest): Promise<ClassroomType> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId(payload as unknown as Record<string, unknown>) as unknown as CreateClassroomTypeRequest;
    const { data } = await api.post('/classroom-types', body);
    return data;
  },

  async update(id: number, payload: UpdateClassroomTypeRequest): Promise<ClassroomType> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload as unknown as Record<string, unknown>) as unknown as UpdateClassroomTypeRequest;
    const { data } = await api.patch(`/classroom-types/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/classroom-types/${id}`);
  },
};

