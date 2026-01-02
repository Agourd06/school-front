import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateModuleCourse, useDeleteModuleCourse, useUpdateModuleCourse } from './useModuleCourse';

// Wrapper hooks that match the expected interface from modals
export const useAddModuleToCourse = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId, volume, coefficient }: { courseId: number; moduleId: number; volume?: number | null; coefficient?: number | null }) =>
      createMutation.mutateAsync({ 
        module_id: moduleId, 
        course_id: courseId,
        volume: volume ?? null,
        coefficient: coefficient ?? null,
      }),
    onSuccess: (_, variables) => {
      // Explicitly invalidate and refetch assignment queries
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
    },
  });
};

export const useRemoveModuleFromCourse = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) =>
      deleteMutation.mutateAsync({ moduleId, courseId }),
    onSuccess: (_, variables) => {
      // Explicitly invalidate and refetch assignment queries
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
    },
  });
};

export const useAddCourseToModule = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateModuleCourse();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId, volume, coefficient }: { moduleId: number; courseId: number; volume?: number | null; coefficient?: number | null }) =>
      createMutation.mutateAsync({ 
        module_id: moduleId, 
        course_id: courseId,
        volume: volume ?? null,
        coefficient: coefficient ?? null,
      }),
    onSuccess: (_, variables) => {
      // Explicitly invalidate and refetch assignment queries
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
    },
  });
};

export const useRemoveCourseFromModule = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteModuleCourse();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) =>
      deleteMutation.mutateAsync({ moduleId, courseId }),
    onSuccess: (_, variables) => {
      // Explicitly invalidate and refetch assignment queries
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
    },
  });
};

export const useReorderModuleInCourse = () => {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId, tri }: { courseId: number; moduleId: number; tri: number }) =>
      updateMutation.mutateAsync({ moduleId, courseId, data: { tri } }),
    onSuccess: (_, variables) => {
      // Explicitly invalidate and refetch assignment queries
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.refetchQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      queryClient.refetchQueries({ queryKey: ['courseAssignments', variables.moduleId] });
    },
  });
};

// Alias for reordering course in module (same API endpoint, different perspective)
export const useReorderCourseInModule = useReorderModuleInCourse;
