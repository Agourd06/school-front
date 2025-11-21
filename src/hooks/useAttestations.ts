import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { attestationApi, type CreateAttestationRequest, type UpdateAttestationRequest, type GetAttestationsParams } from '../api/attestation';

export const useAttestations = (params: GetAttestationsParams = {}) =>
  useQuery({
    queryKey: ['attestations', params],
    queryFn: () => attestationApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useAttestation = (id: number) =>
  useQuery({ queryKey: ['attestations', id], queryFn: () => attestationApi.getById(id), enabled: !!id });

export const useCreateAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAttestationRequest) => attestationApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attestations'] }),
  });
};

export const useUpdateAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttestationRequest }) => attestationApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attestations'] }),
  });
};

export const useDeleteAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attestationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attestations'] }),
  });
};


