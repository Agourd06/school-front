import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentDiplomeApi, type CreateStudentDiplomeRequest, type UpdateStudentDiplomeRequest, type GetAllStudentDiplomeParams } from '../api/studentDiplome';

export const useStudentDiplomes = (params: GetAllStudentDiplomeParams = {}) =>
  useQuery({ queryKey: ['studentdiplomes', params], queryFn: () => studentDiplomeApi.getAll(params) });

export const useStudentDiplome = (id: number) =>
  useQuery({ queryKey: ['studentdiplomes', id], queryFn: () => studentDiplomeApi.getById(id), enabled: !!id });

export const useCreateStudentDiplome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentDiplomeRequest) => studentDiplomeApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentdiplomes'] }),
  });
};

export const useUpdateStudentDiplome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentDiplomeRequest }) => studentDiplomeApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentdiplomes'] }),
  });
};

export const useDeleteStudentDiplome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentDiplomeApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentdiplomes'] }),
  });
};


