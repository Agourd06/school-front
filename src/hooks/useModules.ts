import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../api/module';
import type { UpdateModuleRequest } from '../api/module';
import type { FilterParams } from '../types/api';

export const useModules = (params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['modules', params],
    queryFn: () => moduleApi.getAll(params),
  });
};

export const useModule = (id: number) => {
  return useQuery({
    queryKey: ['modules', id],
    queryFn: () => moduleApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: moduleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateModuleRequest & { id: number }) => 
      moduleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: moduleApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

export const useAddCourseToModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) => 
      moduleApi.addCourse(moduleId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

export const useRemoveCourseFromModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) => 
      moduleApi.removeCourse(moduleId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};
