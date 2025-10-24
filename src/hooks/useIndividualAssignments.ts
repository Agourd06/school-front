import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../api/module';
import { courseApi } from '../api/course';

// Individual course assignment operations
export const useAddCourseToModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) =>
      moduleApi.addCourseToModule(moduleId, courseId),
    onSuccess: (_, variables) => {
      // Invalidate course assignments for this module
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      // Also invalidate modules list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

export const useRemoveCourseFromModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, courseId }: { moduleId: number; courseId: number }) =>
      moduleApi.removeCourseFromModule(moduleId, courseId),
    onSuccess: (_, variables) => {
      // Invalidate course assignments for this module
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      // Also invalidate modules list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};

// Individual module assignment operations
export const useAddModuleToCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) =>
      courseApi.addModuleToCourse(courseId, moduleId),
    onSuccess: (_, variables) => {
      // Invalidate module assignments for this course
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      // Also invalidate courses list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useRemoveModuleFromCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) =>
      courseApi.removeModuleFromCourse(courseId, moduleId),
    onSuccess: (_, variables) => {
      // Invalidate module assignments for this course
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      // Also invalidate courses list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
