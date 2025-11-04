import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { programApi, type Program, type CreateProgramRequest, type UpdateProgramRequest } from '../api/program';
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
    mutationFn: (payload: CreateProgramRequest) => programApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};

export const useUpdateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgramRequest }) => programApi.update(id, data),
    onSuccess: (_result: Program) => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};

export const useDeleteProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
};


