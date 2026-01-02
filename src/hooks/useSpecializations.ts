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
    mutationFn: (payload: CreateSpecializationRequest | FormData) => specializationApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specializations'] }),
  });
};

export const useUpdateSpecialization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: (UpdateSpecializationRequest & { id: number }) | { id: number; formData: FormData }) => {
      if ('formData' in data && data.formData instanceof FormData) {
        return specializationApi.update(data.id, data.formData);
      }
      const { id, ...rest } = data as UpdateSpecializationRequest & { id: number };
      return specializationApi.update(id, rest);
    },
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


