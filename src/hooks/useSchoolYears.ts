import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearApi } from '../api';
import type { CreateSchoolYearRequest, UpdateSchoolYearRequest } from '../api/schoolYear';
import type { FilterParams } from '../types/api';

export const useSchoolYears = (params: FilterParams = {}) => {
  return useQuery({
    queryKey: ['schoolYears', params],
    queryFn: () => schoolYearApi.getAll(params),
  });
};

export const useSchoolYear = (id: number) => {
  return useQuery({
    queryKey: ['schoolYears', id],
    queryFn: () => schoolYearApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSchoolYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchoolYearRequest) => schoolYearApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  });
};

export const useUpdateSchoolYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSchoolYearRequest & { id: number }) => schoolYearApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  });
};

export const useDeleteSchoolYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schoolYearApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  });
};

export default useSchoolYears;
