import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllPlanningsInDateRange,
  planningStudentApi,
  type GetPlanningStudentParams,
  type PlanningStudentEntry,
  type PlanningStudentPayload,
  type UpdatePlanningStudentPayload,
} from '../api/planningStudent';

const QUERY_KEY = 'planningStudents';

/** Fetches all plannings in a date range (same filter logic as planning page) by requesting every page. Use in modals to avoid pagination limits. */
export const useAllPlanningsInRange = (
  params: (GetPlanningStudentParams & { date_day_from: string; date_day_to: string }) | null,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: [QUERY_KEY, 'allInRange', params],
    queryFn: () => getAllPlanningsInDateRange(params!),
    placeholderData: keepPreviousData,
    enabled: (options?.enabled ?? true) && !!params?.date_day_from && !!params?.date_day_to,
  });

export const usePlanningStudents = (params: GetPlanningStudentParams = {}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => planningStudentApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const usePlanningStudent = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => planningStudentApi.getById(id),
    enabled: !!id,
  });

export const useCreatePlanningStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlanningStudentPayload) => planningStudentApi.create(payload),
    onSuccess: (result: PlanningStudentEntry) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData<PlanningStudentEntry | undefined>([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdatePlanningStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanningStudentPayload }) => planningStudentApi.update(id, data),
    onSuccess: (result: PlanningStudentEntry) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeletePlanningStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => planningStudentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useDuplicatePlanningStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      source_planning_id: number;
      type: 'week' | 'frequency' | 'recurring';
      number_of_weeks?: number;
      duration_months?: number;
    }) => planningStudentApi.duplicate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


