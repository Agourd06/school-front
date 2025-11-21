import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCoursesForModule } from './useModuleCourse';
import { courseApi } from '../api/course';
import { moduleApi } from '../api/module';
import type { Course } from '../api/course';
import type { ModuleCourse } from '../api/moduleCourse';

// Transform ModuleCourse to the expected format
// Note: volume and coefficient come from the module-course relationship table (module-specific values)
// These are NOT the original course's volume/coefficient, but values specific to this module-course assignment
const transformModuleCourseToCourse = (mc: ModuleCourse): Course & { tri?: number; assignment_created_at?: string; assignment_volume?: number | null; assignment_coefficient?: number | null } => ({
  id: mc.course.id,
  title: mc.course.title,
  tri: mc.tri,
  assignment_created_at: mc.created_at,
  status: 1, // Default status
  description: undefined,
  volume: mc.volume ?? undefined, // Volume from module-course relationship table (module-specific)
  coefficient: mc.coefficient ?? undefined, // Coefficient from module-course relationship table (module-specific)
  assignment_volume: mc.volume ?? null, // Store assignment-specific volume from module-course table
  assignment_coefficient: mc.coefficient ?? null, // Store assignment-specific coefficient from module-course table
  company_id: undefined,
});

export const useCourseAssignments = (moduleId: number) => {
  const coursesForModule = useCoursesForModule(moduleId, { limit: 100 });
  const allCourses = useQuery({
    queryKey: ['courses', { limit: 100 }],
    queryFn: () => courseApi.getAll({ limit: 100 }),
    staleTime: 0, // Always consider stale to ensure fresh data
  });

  return useQuery({
    queryKey: ['courseAssignments', moduleId],
    queryFn: async () => {
      const assignedData = coursesForModule.data;
      const allCoursesData = allCourses.data;

      if (!assignedData || !allCoursesData) {
        return { assigned: [], unassigned: [] };
      }

      // Transform assigned courses from ModuleCourse format
      const assigned = (assignedData.data || []).map(transformModuleCourseToCourse);

      // Find unassigned courses (those not in assigned list)
      const assignedIds = new Set(assigned.map(c => c.id));
      const unassigned = (allCoursesData.data || [])
        .filter((c: Course) => !assignedIds.has(c.id) && c.status !== -2)
        .map((c: Course) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          description: c.description,
          volume: c.volume,
          coefficient: c.coefficient,
          company_id: c.company_id,
        }));

      return { assigned, unassigned };
    },
    enabled: !!moduleId && coursesForModule.data !== undefined && allCourses.data !== undefined,
    staleTime: 0, // Always consider stale to ensure fresh data after mutations
    refetchOnMount: true, // Refetch when component mounts
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
