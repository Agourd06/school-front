import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { levelApi, type CreateLevelRequest, type UpdateLevelRequest, type GetLevelsParams } from '../api/level';

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
    mutationFn: (payload: CreateLevelRequest | FormData) => levelApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};

export const useUpdateLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: (UpdateLevelRequest & { id: number }) | { id: number; formData: FormData }) => {
      if ('formData' in data && data.formData instanceof FormData) {
        return levelApi.update(data.id, data.formData);
      }
      const { id, ...rest } = data as UpdateLevelRequest & { id: number };
      return levelApi.update(id, rest);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};

export const useDeleteLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => levelApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });
};


