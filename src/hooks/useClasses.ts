import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { classesApi, type CreateClassRequest, type UpdateClassRequest, type GetClassesParams } from '../api/classes';

export const useClasses = (params: GetClassesParams = {}) =>
  useQuery({
    queryKey: ['classes', params],
    queryFn: () => classesApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useClass = (id: number) =>
  useQuery({
    queryKey: ['classes', id],
    queryFn: () => classesApi.getById(id),
    enabled: !!id,
  });

export const useCreateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassRequest) => classesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassRequest }) => classesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
};

export const useDeleteClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
};


