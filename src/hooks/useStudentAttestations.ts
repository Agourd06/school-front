import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentAttestationApi, type CreateStudentAttestationRequest, type UpdateStudentAttestationRequest, type StudentAttestation, type GetStudentAttestationsParams } from '../api/studentAttestation';

export const useStudentAttestations = (params: GetStudentAttestationsParams = {}) =>
  useQuery({
    queryKey: ['studentAttestations', params],
    queryFn: () => studentAttestationApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useStudentAttestation = (id: number) =>
  useQuery({ queryKey: ['studentAttestations', id], queryFn: () => studentAttestationApi.getById(id), enabled: !!id });

export const useCreateStudentAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentAttestationRequest) => studentAttestationApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentAttestations'] }),
  });
};

export const useUpdateStudentAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentAttestationRequest }) => studentAttestationApi.update(id, data),
    onSuccess: (_result: StudentAttestation) => qc.invalidateQueries({ queryKey: ['studentAttestations'] }),
  });
};

export const useDeleteStudentAttestation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentAttestationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentAttestations'] }),
  });
};


