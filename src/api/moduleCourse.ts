import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

export interface ModuleCourse {
  module_id: number;
  course_id: number;
  tri: number;
  created_at: string;
  updated_at: string;
  module: {
    id: number;
    title: string;
  };
  course: {
    id: number;
    title: string;
  };
}

export interface CreateModuleCourseRequest {
  module_id: number;
  course_id: number;
  tri?: number; // Optional; defaults to next slot
}

export interface UpdateModuleCourseRequest {
  tri: number; // Only field supported right now
}

export interface GetModuleCourseParams extends FilterParams {
  module_id?: number;
  course_id?: number;
}

export const moduleCourseApi = {
  /**
   * Get all module-course relationships with pagination
   */
  getAll: async (params: GetModuleCourseParams = {}): Promise<PaginatedResponse<ModuleCourse>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.module_id) queryParams.append('module_id', params.module_id.toString());
    if (params.course_id) queryParams.append('course_id', params.course_id.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/module-course?${queryString}` : '/module-course';

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get a specific module-course relationship
   */
  getById: async (moduleId: number, courseId: number): Promise<ModuleCourse> => {
    const response = await api.get(`/module-course/${moduleId}/${courseId}`);
    return response.data;
  },

  /**
   * Create a new module-course relationship
   * Handles 409 conflict if relationship already exists
   */
  create: async (data: CreateModuleCourseRequest): Promise<ModuleCourse> => {
    try {
      const response = await api.post('/module-course', data);
      return response.data;
    } catch (error: any) {
      // If relationship already exists (409), return the existing one
      if (error?.response?.status === 409) {
        // Try to get the existing relationship
        const existing = await moduleCourseApi.getById(data.module_id, data.course_id);
        return existing;
      }
      throw error;
    }
  },

  /**
   * Update a module-course relationship (only tri field supported)
   */
  update: async (moduleId: number, courseId: number, data: UpdateModuleCourseRequest): Promise<ModuleCourse> => {
    const response = await api.patch(`/module-course/${moduleId}/${courseId}`, data);
    return response.data;
  },

  /**
   * Delete a module-course relationship
   */
  delete: async (moduleId: number, courseId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/module-course/${moduleId}/${courseId}`);
    return response.data;
  },

  /**
   * Get assigned modules for a course (convenience method)
   */
  getModulesForCourse: async (courseId: number, params: FilterParams = {}): Promise<PaginatedResponse<ModuleCourse>> => {
    return moduleCourseApi.getAll({ ...params, course_id: courseId });
  },

  /**
   * Get assigned courses for a module (convenience method)
   */
  getCoursesForModule: async (moduleId: number, params: FilterParams = {}): Promise<PaginatedResponse<ModuleCourse>> => {
    return moduleCourseApi.getAll({ ...params, module_id: moduleId });
  },
};

