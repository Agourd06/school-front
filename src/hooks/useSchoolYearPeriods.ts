import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearPeriodApi } from '../api';
import type { CreateSchoolYearPeriodRequest, UpdateSchoolYearPeriodRequest } from '../api/schoolYearPeriod';
import type { FilterParams } from '../types/api';

export const useSchoolYearPeriods = (params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['schoolYearPeriods', params],
    queryFn: () => schoolYearPeriodApi.getAll(params),
  });
};

export const useSchoolYearPeriod = (id: number) => {
  return useQuery({
    queryKey: ['schoolYearPeriods', id],
    queryFn: () => schoolYearPeriodApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSchoolYearPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchoolYearPeriodRequest) => schoolYearPeriodApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYearPeriods'] }),
  });
};

export const useUpdateSchoolYearPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSchoolYearPeriodRequest & { id: number }) => schoolYearPeriodApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYearPeriods'] }),
  });
};

export const useDeleteSchoolYearPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schoolYearPeriodApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYearPeriods'] }),
  });
};

export default useSchoolYearPeriods;
