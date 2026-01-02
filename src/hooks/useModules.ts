import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../api/module';
import type { UpdateModuleRequest, ModuleCourseListItem } from '../api/module';
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
    mutationFn: (data: (UpdateModuleRequest & { id: number }) | { id: number; formData: FormData }) => {
      if ('formData' in data && data.formData instanceof FormData) {
        return moduleApi.update(data.id, data.formData);
      }
      const { id, ...rest } = data as UpdateModuleRequest & { id: number };
      return moduleApi.update(id, rest);
    },
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

export const useModuleCourses = (moduleId?: number) =>
  useQuery<ModuleCourseListItem[]>({
    queryKey: ['moduleCourses', moduleId],
    queryFn: () => moduleApi.getLinkedCourses(moduleId as number),
    enabled: !!moduleId,
  });
