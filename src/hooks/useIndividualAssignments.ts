import { useMutation } from '@tanstack/react-query';
import { useCreateModuleCourse, useDeleteModuleCourse, useUpdateModuleCourse } from './useModuleCourse';

// Wrapper hooks that match the expected interface from modals
export const useAddModuleToCourse = () => {
  const createMutation = useCreateModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId, volume, coefficient }: { courseId: number; moduleId: number; volume?: number | null; coefficient?: number | null }) =>
      createMutation.mutateAsync({ 
        module_id: moduleId, 
        course_id: courseId,
        volume: volume ?? null,
        coefficient: coefficient ?? null,
      }),
  });
};

export const useRemoveModuleFromCourse = () => {
  const deleteMutation = useDeleteModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) =>
      deleteMutation.mutateAsync({ moduleId, courseId }),
  });
};

export const useAddCourseToModule = () => {
  const createMutation = useCreateModuleCourse();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId, volume, coefficient }: { moduleId: number; courseId: number; volume?: number | null; coefficient?: number | null }) =>
      createMutation.mutateAsync({ 
        module_id: moduleId, 
        course_id: courseId,
        volume: volume ?? null,
        coefficient: coefficient ?? null,
      }),
  });
};

export const useRemoveCourseFromModule = () => {
  const deleteMutation = useDeleteModuleCourse();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) =>
      deleteMutation.mutateAsync({ moduleId, courseId }),
  });
};

export const useReorderModuleInCourse = () => {
  const updateMutation = useUpdateModuleCourse();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId, tri }: { courseId: number; moduleId: number; tri: number }) =>
      updateMutation.mutateAsync({ moduleId, courseId, data: { tri } }),
  });
};

// Alias for reordering course in module (same API endpoint, different perspective)
export const useReorderCourseInModule = useReorderModuleInCourse;
