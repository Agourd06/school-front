import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { administratorsApi } from '../api/administrators';
import type { CreateAdministratorRequest, UpdateAdministratorRequest, GetAllAdministratorsParams } from '../api/administrators';

export const useAdministrators = (params: GetAllAdministratorsParams = {}) => {
  return useQuery({
    queryKey: ['administrators', params],
    queryFn: () => administratorsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useAdministrator = (id: number) => {
  return useQuery({
    queryKey: ['administrators', id],
    queryFn: () => administratorsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAdministrator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdministratorRequest) => administratorsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administrators'] }),
  });
};

export const useUpdateAdministrator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateAdministratorRequest & { id: number }) => administratorsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administrators'] }),
  });
};

export const useDeleteAdministrator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => administratorsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administrators'] }),
  });
};

export default useAdministrators;


