import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

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
  coefficient?: number;
  status: number;
  company_id?: number;
}

export interface Course {
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
  modules?: Module[];
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  company_id?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  company_id?: number;
}

export const courseApi = {
  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<Course>> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/course?${queryString}` : '/course';
    
    console.log('Courses API request params:', params);
    console.log('Courses API request URL:', url);
    
    const response = await api.get(url);
    console.log('Courses API response:', response.data);
    
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
