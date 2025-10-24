import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../api/module';

export const useCourseAssignments = (moduleId: number) => {
  return useQuery({
    queryKey: ['courseAssignments', moduleId],
    queryFn: () => moduleApi.getCourseAssignments(moduleId),
    enabled: !!moduleId,
  });
};

export const useUpdateCourseAssignments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: number; data: { add: number[]; remove: number[] } }) =>
      moduleApi.updateCourseAssignments(moduleId, data),
    onSuccess: (_, variables) => {
      // Invalidate course assignments for this module
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', variables.moduleId] });
      // Also invalidate modules list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
};
