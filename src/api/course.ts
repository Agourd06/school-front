import api from './axios';

interface Company {
  id: number;
  name: string;
  email: string;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status: number;
  company_id?: number;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  company?: Company;
  modules?: Module[];
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status?: number;
  company_id?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status?: number;
  company_id?: number;
}

export const courseApi = {
  getAll: async (): Promise<Course[]> => {
    const response = await api.get('/course');
    return response.data;
  },

  getById: async (id: number): Promise<Course> => {
    const response = await api.get(`/course/${id}`);
    return response.data;
  },

  create: async (data: CreateCourseRequest): Promise<Course> => {
    const response = await api.post('/course', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCourseRequest): Promise<Course> => {
    const response = await api.patch(`/course/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/course/${id}`);
    return response.data;
  },

  addModule: async (courseId: number, moduleId: number): Promise<{ message: string }> => {
    const response = await api.post(`/course/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  removeModule: async (courseId: number, moduleId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/course/${courseId}/modules/${moduleId}`);
    return response.data;
  },
};
