import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  levelPricingApi,
  type CreateLevelPricingPayload,
  type GetLevelPricingParams,
  type LevelPricing,
  type UpdateLevelPricingPayload,
} from '../api/levelPricing';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'levelPricings';

export const useLevelPricings = (params: GetLevelPricingParams = {}) =>
  useQuery<PaginatedResponse<LevelPricing>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => levelPricingApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useLevelPricing = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => levelPricingApi.getById(id),
    enabled: !!id,
  });

export const useCreateLevelPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLevelPricingPayload) => levelPricingApi.create(payload),
    onSuccess: (result: LevelPricing) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdateLevelPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLevelPricingPayload }) => levelPricingApi.update(id, data),
    onSuccess: (result: LevelPricing) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteLevelPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => levelPricingApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


