import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { programApi, type CreateProgramRequest, type UpdateProgramRequest } from '../api/program';
import type { FilterParams } from '../types/api';

export const usePrograms = (params: FilterParams = {}) =>
  useQuery({
    queryKey: ['programs', params],
    queryFn: () => programApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useProgram = (id: number) =>
  useQuery({ queryKey: ['programs', id], queryFn: () => programApi.getById(id), enabled: !!id });

export const useCreateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProgramRequest | FormData) => programApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};

export const useUpdateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: (UpdateProgramRequest & { id: number }) | { id: number; formData: FormData }) => {
      if ('formData' in data && data.formData instanceof FormData) {
        return programApi.update(data.id, data.formData);
      }
      const { id, ...rest } = data as UpdateProgramRequest & { id: number };
      return programApi.update(id, rest);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};

export const useDeleteProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};


