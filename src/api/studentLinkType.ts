import api from './axios';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface StudentLinkType {
  id: number;
  title: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentLinkTypeRequest {
  title: string;
  company_id?: number; // Optional - backend sets it from authenticated user
  status?: number; // -2,-1,0,1,2
}

export type UpdateStudentLinkTypeRequest = Partial<CreateStudentLinkTypeRequest>;

export interface GetAllStudentLinkTypeParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  // company_id is automatically filtered by backend from JWT, no need to send it
}

export const studentLinkTypeApi = {
  async getAll(params: GetAllStudentLinkTypeParams = {}): Promise<{ data: StudentLinkType[]; meta: any }> {
    const { data } = await api.get('/studentlinktype', { params });
    return data;
  },

  async getById(id: number): Promise<StudentLinkType> {
    const { data } = await api.get(`/studentlinktype/${id}`);
    return data;
  },

  async create(payload: CreateStudentLinkTypeRequest): Promise<StudentLinkType> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    const body = ensureCompanyId(payload);
    const { data } = await api.post('/studentlinktype', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentLinkTypeRequest): Promise<StudentLinkType> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    const body = ensureCompanyId(payload);
    const { data } = await api.patch(`/studentlinktype/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/studentlinktype/${id}`);
  },
};


