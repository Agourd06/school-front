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
  tri?: number;
  assignment_created_at?: string;
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
  tri?: number;
  assignment_created_at?: string;
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
  module_ids?: number[];
}

const fetchCourses = async (params: FilterParams = {}): Promise<PaginatedResponse<Course>> => {
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

  if (Array.isArray(response.data)) {
    return {
      data: response.data,
      meta: {
        page: 1,
        limit: response.data.length,
        total: response.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  return response.data;
};

export const courseApi = {
  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<Course>> => {
    const hasStatusFilter = params.status !== undefined && params.status !== null;

    if (!hasStatusFilter) {
      return fetchCourses(params);
    }

    const fallbackParams: FilterParams = { ...params };
    const targetStatus = params.status as number;
    delete fallbackParams.status;

    const fallbackResponse = await fetchCourses(fallbackParams);
    const filteredData = fallbackResponse.data.filter(course => course.status === targetStatus);

    const limit = (params.limit ?? fallbackResponse.meta.limit ?? filteredData.length) || 1;
    const page = Math.max(1, Math.min(params.page ?? 1, Math.ceil(filteredData.length / limit) || 1));
    const start = (page - 1) * limit;
    const paginatedData = filteredData.slice(start, start + limit);
    const total = filteredData.length;
    const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / limit));

    return {
      data: paginatedData,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
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

  // Module assignment management
  getModuleAssignments: async (courseId: number): Promise<{ assigned: Module[]; unassigned: Module[] }> => {
    const response = await api.get(`/course/${courseId}/modules`);
    return response.data;
  },

  updateModuleAssignments: async (courseId: number, data: { add: number[]; remove: number[] }): Promise<{ message: string }> => {
    const response = await api.post(`/course/${courseId}/modules`, data);
    return response.data;
  },

  // Individual module assignment operations
  addModuleToCourse: async (courseId: number, moduleId: number): Promise<{ message: string }> => {
    const response = await api.post(`/course/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  removeModuleFromCourse: async (courseId: number, moduleId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/course/${courseId}/modules/${moduleId}`);
    return response.data;
  },
};
