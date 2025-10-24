import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../api/course';
import type { UpdateCourseRequest } from '../api/course';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getAll,
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
    mutationFn: ({ id, ...data }: UpdateCourseRequest & { id: number }) => 
      courseApi.update(id, data),
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
