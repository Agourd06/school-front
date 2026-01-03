import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearPeriodApi } from '../api';
import type { CreateSchoolYearPeriodRequest, UpdateSchoolYearPeriodRequest } from '../api/schoolYearPeriod';
import type { FilterParams } from '../types/api';

type SchoolYearPeriodFilterParams = FilterParams & {
  schoolYearId?: number;
  school_year_id?: number;
  school_year_period_id?: number;
  lifecycle_status?: string;
};

export const useSchoolYearPeriods = (params: SchoolYearPeriodFilterParams = {}) => {
  const hasSchoolYearId =
    params.schoolYearId !== undefined && params.schoolYearId !== null
      ? true
      : params.school_year_id !== undefined && params.school_year_id !== null;
  
  return useQuery({
    queryKey: ['schoolYearPeriods', params],
    queryFn: () => schoolYearPeriodApi.getAll(params),
    enabled: hasSchoolYearId,
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
