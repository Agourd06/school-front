import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { levelApi, type CreateLevelRequest, type UpdateLevelRequest, type Level, type GetLevelsParams } from '../api/level';

export const useLevels = (params: GetLevelsParams = {}) =>
  useQuery({
    queryKey: ['levels', params],
    queryFn: () => levelApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useLevel = (id: number) =>
  useQuery({ queryKey: ['levels', id], queryFn: () => levelApi.getById(id), enabled: !!id });

export const useCreateLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLevelRequest) => levelApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};

export const useUpdateLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLevelRequest }) => levelApi.update(id, data),
    onSuccess: (_res: Level) => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};

export const useDeleteLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => levelApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};


