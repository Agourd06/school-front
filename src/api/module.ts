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
  tri?: number;
  assignment_created_at?: string;
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status: number;
  company_id?: number;
  pdf_file?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: Company;
  courses?: Course[];
  tri?: number;
  assignment_created_at?: string;
}

export interface ModuleCourseListItem {
  id: number;
  title: string;
  description?: string | null;
  volume?: number | null;
  coefficient?: number | null;
  status?: number;
  tri?: number | null;
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  company_id?: number; // Optional - backend sets it from authenticated user
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  company_id?: number;
  course_ids?: number[];
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
    
    const response = await api.get(url);
    
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

  create: async (data: CreateModuleRequest | FormData): Promise<Module> => {
    // If FormData, send directly (for PDF uploads)
    if (data instanceof FormData) {
      const response = await api.post('/module', data);
      return response.data;
    }
    
    // Otherwise, send as JSON (backward compatibility)
    const { company_id: _companyId, ...rest } = data;
    void _companyId;
    const response = await api.post('/module', rest);
    return response.data;
  },

  update: async (id: number, data: UpdateModuleRequest | FormData): Promise<Module> => {
    // If FormData, send directly (for PDF uploads)
    if (data instanceof FormData) {
      const response = await api.patch(`/module/${id}`, data);
      return response.data;
    }
    
    // Otherwise, send as JSON (backward compatibility)
    const { company_id: _companyId, ...rest } = data;
    void _companyId;
    const response = await api.patch(`/module/${id}`, rest);
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

  getLinkedCourses: async (moduleId: number): Promise<ModuleCourseListItem[]> => {
    const { data } = await api.get(`/modules/${moduleId}/courses`);
    return data;
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

