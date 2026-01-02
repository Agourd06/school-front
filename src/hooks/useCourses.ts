import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../api/course';
import type { UpdateCourseRequest } from '../api/course';
import type { FilterParams } from '../types/api';

export const useCourses = (params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.getAll(params),
  });
};

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => courseApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: (UpdateCourseRequest & { id: number }) | { id: number; formData: FormData }) => {
      if ('formData' in data && data.formData instanceof FormData) {
        return courseApi.update(data.id, data.formData);
      }
      const { id, ...rest } = data as UpdateCourseRequest & { id: number };
      return courseApi.update(id, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useAddModuleToCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) => 
      courseApi.addModule(courseId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useRemoveModuleFromCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) => 
      courseApi.removeModule(courseId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
