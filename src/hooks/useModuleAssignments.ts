import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useModulesForCourse } from './useModuleCourse';
import { moduleApi } from '../api/module';
import type { Module } from '../api/module';

// Transform ModuleCourse to the expected format
const transformModuleCourseToModule = (mc: any): Module & { tri?: number; assignment_created_at?: string } => ({
  id: mc.module.id,
  title: mc.module.title,
  tri: mc.tri,
  assignment_created_at: mc.created_at,
  status: 1, // Default status
  description: undefined,
  volume: undefined,
  coefficient: undefined,
  company_id: undefined,
});

export const useModuleAssignments = (courseId: number) => {
  const modulesForCourse = useModulesForCourse(courseId, { limit: 100 });
  const allModules = useQuery({
    queryKey: ['modules', { limit: 100 }],
    queryFn: () => moduleApi.getAll({ limit: 100 }),
    staleTime: 0, // Always consider stale to ensure fresh data
  });

  return useQuery({
    queryKey: ['moduleAssignments', courseId],
    queryFn: async () => {
      const assignedData = modulesForCourse.data;
      const allModulesData = allModules.data;

      if (!assignedData || !allModulesData) {
        return { assigned: [], unassigned: [] };
      }

      // Transform assigned modules from ModuleCourse format
      const assigned = (assignedData.data || []).map(transformModuleCourseToModule);

      // Find unassigned modules (those not in assigned list)
      const assignedIds = new Set(assigned.map(m => m.id));
      const unassigned = (allModulesData.data || [])
        .filter((m: Module) => !assignedIds.has(m.id) && m.status !== -2)
        .map((m: Module) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          description: m.description,
          volume: m.volume,
          coefficient: m.coefficient,
          company_id: m.company_id,
        }));

      return { assigned, unassigned };
    },
    enabled: !!courseId && modulesForCourse.data !== undefined && allModules.data !== undefined,
    staleTime: 0, // Always consider stale to ensure fresh data after mutations
    refetchOnMount: true, // Refetch when component mounts
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
