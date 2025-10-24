import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

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
  coefficient?: number;
  status: number;
  company_id?: number;
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
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
  coefficient?: number;
  status?: number;
  company_id?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  company_id?: number;
}

export const moduleApi = {
  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<Module>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/module?${queryString}` : '/module';
    
    console.log('Modules API request params:', params);
    console.log('Modules API request URL:', url);
    
    const response = await api.get(url);
    console.log('Modules API response:', response.data);
    
    // Handle both direct array and wrapped response formats
    if (Array.isArray(response.data)) {
      // Legacy format - convert to paginated format
      return {
        data: response.data,
        meta: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
    
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

  // Course assignment management
  getCourseAssignments: async (moduleId: number): Promise<{ assigned: Course[]; unassigned: Course[] }> => {
    const response = await api.get(`/module/${moduleId}/courses`);
    return response.data;
  },

  updateCourseAssignments: async (moduleId: number, data: { add: number[]; remove: number[] }): Promise<{ message: string }> => {
    const response = await api.post(`/module/${moduleId}/courses`, data);
    return response.data;
  },

  // Individual course assignment operations
  addCourseToModule: async (moduleId: number, courseId: number): Promise<{ message: string }> => {
    const response = await api.post(`/module/${moduleId}/courses/${courseId}`);
    return response.data;
  },

  removeCourseFromModule: async (moduleId: number, courseId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/module/${moduleId}/courses/${courseId}`);
    return response.data;
  },
};

