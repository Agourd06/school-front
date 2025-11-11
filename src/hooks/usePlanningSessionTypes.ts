import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  planningSessionTypeApi,
  type PlanningSessionType,
  type CreatePlanningSessionTypePayload,
  type UpdatePlanningSessionTypePayload,
  type GetPlanningSessionTypeParams,
} from '../api/planningSessionType';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'planningSessionTypes';

export const usePlanningSessionTypes = (params: GetPlanningSessionTypeParams = {}) =>
  useQuery<PaginatedResponse<PlanningSessionType>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => planningSessionTypeApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const usePlanningSessionType = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => planningSessionTypeApi.getById(id),
    enabled: !!id,
  });

export const useCreatePlanningSessionType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanningSessionTypePayload) => planningSessionTypeApi.create(payload),
    onSuccess: (result: PlanningSessionType) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdatePlanningSessionType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanningSessionTypePayload }) =>
      planningSessionTypeApi.update(id, data),
    onSuccess: (result: PlanningSessionType) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeletePlanningSessionType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => planningSessionTypeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

