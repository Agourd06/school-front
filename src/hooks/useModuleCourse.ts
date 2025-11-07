import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleCourseApi, type CreateModuleCourseRequest, type UpdateModuleCourseRequest } from '../api/moduleCourse';
import type { FilterParams } from '../types/api';

/**
 * Get module-course relationships with filters
 */
export const useModuleCourses = (params: FilterParams & { module_id?: number; course_id?: number } = {}) => {
  return useQuery({
    queryKey: ['moduleCourses', params],
    queryFn: () => moduleCourseApi.getAll(params),
  });
};

/**
 * Get a specific module-course relationship
 */
export const useModuleCourse = (moduleId: number, courseId: number) => {
  return useQuery({
    queryKey: ['moduleCourse', moduleId, courseId],
    queryFn: () => moduleCourseApi.getById(moduleId, courseId),
    enabled: !!moduleId && !!courseId,
  });
};

/**
 * Get assigned modules for a course
 */
export const useModulesForCourse = (courseId: number, params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['modulesForCourse', courseId, params],
    queryFn: () => moduleCourseApi.getModulesForCourse(courseId, params),
    enabled: !!courseId,
  });
};

/**
 * Get assigned courses for a module
 */
export const useCoursesForModule = (moduleId: number, params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['coursesForModule', moduleId, params],
    queryFn: () => moduleCourseApi.getCoursesForModule(moduleId, params),
    enabled: !!moduleId,
  });
};

/**
 * Create a module-course relationship
 */
export const useCreateModuleCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModuleCourseRequest) => moduleCourseApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch related queries immediately
      if (variables.course_id) {
        queryClient.invalidateQueries({ queryKey: ['modulesForCourse', variables.course_id] });
        queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.course_id] });
        // Force refetch
        queryClient.refetchQueries({ queryKey: ['modulesForCourse', variables.course_id] });
        queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.course_id] });
      }
      if (variables.module_id) {
        queryClient.invalidateQueries({ queryKey: ['coursesForModule', variables.module_id] });
        queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.module_id] });
        // Force refetch
        queryClient.refetchQueries({ queryKey: ['coursesForModule', variables.module_id] });
        queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.module_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['moduleCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

/**
 * Update a module-course relationship (reorder)
 */
export const useUpdateModuleCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, courseId, data }: { moduleId: number; courseId: number; data: UpdateModuleCourseRequest }) =>
      moduleCourseApi.update(moduleId, courseId, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch related queries immediately
      queryClient.invalidateQueries({ queryKey: ['moduleCourse', variables.moduleId, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['modulesForCourse', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['coursesForModule', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['modulesForCourse', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['coursesForModule', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleCourses'] });
    },
  });
};

/**
 * Delete a module-course relationship
 */
export const useDeleteModuleCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) =>
      moduleCourseApi.delete(moduleId, courseId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch related queries immediately
      queryClient.invalidateQueries({ queryKey: ['moduleCourse', variables.moduleId, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['modulesForCourse', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['coursesForModule', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['modulesForCourse', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['coursesForModule', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

