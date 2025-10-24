import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../api/course';

export const useModuleAssignments = (courseId: number) => {
  return useQuery({
    queryKey: ['moduleAssignments', courseId],
    queryFn: () => courseApi.getModuleAssignments(courseId),
    enabled: !!courseId,
  });
};

export const useUpdateModuleAssignments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: { add: number[]; remove: number[] } }) =>
      courseApi.updateModuleAssignments(courseId, data),
    onSuccess: (_, variables) => {
      // Invalidate module assignments for this course
      queryClient.invalidateQueries({ queryKey: ['moduleAssignments', variables.courseId] });
      // Also invalidate courses list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
