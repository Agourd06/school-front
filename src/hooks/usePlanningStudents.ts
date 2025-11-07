import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  planningStudentApi,
  type GetPlanningStudentParams,
  type PlanningStudentEntry,
  type PlanningStudentPayload,
  type UpdatePlanningStudentPayload,
} from '../api/planningStudent';

const QUERY_KEY = 'planningStudents';

export const usePlanningStudents = (params: GetPlanningStudentParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => planningStudentApi.getAll(params),
    placeholderData: keepPreviousData,
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


