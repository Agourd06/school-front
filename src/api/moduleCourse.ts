import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

export interface ModuleCourse {
  module_id: number;
  course_id: number;
  tri: number;
  volume?: number | null;
  coefficient?: number | null;
  status?: number; // 0: disabled, 1: active, 2: pending, -1: archived, -2: deleted
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
  volume?: number | null; // Optional; can be set from course when creating
  coefficient?: number | null; // Optional; can be set from course when creating
}

export interface UpdateModuleCourseRequest {
  tri?: number;
  volume?: number | null;
  coefficient?: number | null;
  status?: number; // 0: disabled, 1: active, 2: pending, -1: archived, -2: deleted
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
   * If the existing relationship is soft-deleted (status = -2), restore it by updating status to 1
   * If the relationship is already active, return it silently
   */
  create: async (data: CreateModuleCourseRequest): Promise<ModuleCourse> => {
    try {
      const response = await api.post('/module-course', data);
      return response.data;
    } catch (error: any) {
      // If relationship already exists (409), try to restore it if it's soft-deleted
      if (error?.response?.status === 409) {
        try {
          // Try to restore by updating status to 1 (active)
          // This will work if the relationship exists and is soft-deleted (status = -2)
          const restored = await moduleCourseApi.update(data.module_id, data.course_id, {
            status: 1, // Restore to active
            volume: data.volume ?? null,
            coefficient: data.coefficient ?? null,
          });
          return restored;
        } catch (updateError: any) {
          // If update fails, the relationship might already be active
          // Try to get the existing relationship
          try {
            const existing = await moduleCourseApi.getById(data.module_id, data.course_id);
            // Return the existing relationship - it's already active
            return existing;
          } catch (getError: any) {
            // If getById also fails (404), the backend might filter out soft-deleted items
            // In this case, the relationship exists but is soft-deleted and filtered out
            // Try updating anyway - the backend should allow updating soft-deleted items
            // If this also fails, we'll throw the original error
            if (getError?.response?.status === 404) {
              // Relationship exists but is filtered out (soft-deleted)
              // Try update again - backend should restore it
              try {
                const restored = await moduleCourseApi.update(data.module_id, data.course_id, {
                  status: 1,
                  volume: data.volume ?? null,
                  coefficient: data.coefficient ?? null,
                });
                return restored;
              } catch (finalError: any) {
                // If everything fails, throw original error
                throw error;
              }
            }
            // For other getById errors, throw original error
            throw error;
          }
        }
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

