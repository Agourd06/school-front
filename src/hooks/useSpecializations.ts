import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { specializationApi, type CreateSpecializationRequest, type UpdateSpecializationRequest, type GetSpecializationsParams } from '../api/specialization';

export const useSpecializations = (params: GetSpecializationsParams = {}) =>
  useQuery({
    queryKey: ['specializations', params],
    queryFn: () => specializationApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useSpecialization = (id: number) =>
  useQuery({ queryKey: ['specializations', id], queryFn: () => specializationApi.getById(id), enabled: !!id });

export const useCreateSpecialization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSpecializationRequest) => specializationApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specializations'] }),
  });
};

export const useUpdateSpecialization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSpecializationRequest }) => specializationApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specializations'] }),
  });
};

export const useDeleteSpecialization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => specializationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specializations'] }),
  });
};


