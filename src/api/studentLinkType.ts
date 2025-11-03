import api from './axios';

export interface StudentLinkType {
  id: number;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentLinkTypeRequest {
  title: string;
  company_id?: number;
  status?: number; // -2,-1,0,1,2
}

export type UpdateStudentLinkTypeRequest = Partial<CreateStudentLinkTypeRequest>;

export interface GetAllStudentLinkTypeParams {
  page?: number;
  limit?: number;
  search?: string;
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
    const { data } = await api.post('/studentlinktype', payload);
    return data;
  },

  async update(id: number, payload: UpdateStudentLinkTypeRequest): Promise<StudentLinkType> {
    const { data } = await api.patch(`/studentlinktype/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/studentlinktype/${id}`);
  },
};


