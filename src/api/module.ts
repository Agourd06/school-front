import api from './axios';

// Forward declarations
interface Company {
  id: number;
  name: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status: number;
  company_id?: number;
}

export interface Module {
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
  courses?: Course[];
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status?: number;
  company_id?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  volume?: number;
  confusion?: number;
  status?: number;
  company_id?: number;
}

export const moduleApi = {
  getAll: async (): Promise<Module[]> => {
    const response = await api.get('/module');
    return response.data;
  },

  getById: async (id: number): Promise<Module> => {
    const response = await api.get(`/module/${id}`);
    return response.data;
  },

  create: async (data: CreateModuleRequest): Promise<Module> => {
    const response = await api.post('/module', data);
    return response.data;
  },

  update: async (id: number, data: UpdateModuleRequest): Promise<Module> => {
    const response = await api.patch(`/module/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/module/${id}`);
    return response.data;
  },

  addCourse: async (moduleId: number, courseId: number): Promise<{ message: string }> => {
    const response = await api.post(`/module/${moduleId}/courses/${courseId}`);
    return response.data;
  },

  removeCourse: async (moduleId: number, courseId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/module/${moduleId}/courses/${courseId}`);
    return response.data;
  },
};

