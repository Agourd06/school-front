import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentContactApi, type CreateStudentContactRequest, type UpdateStudentContactRequest, type GetAllStudentContactParams } from '../api/studentContact';

export const useStudentContacts = (params: GetAllStudentContactParams = {}) =>
  useQuery({ queryKey: ['studentcontacts', params], queryFn: () => studentContactApi.getAll(params) });

export const useStudentContact = (id: number) =>
  useQuery({ queryKey: ['studentcontacts', id], queryFn: () => studentContactApi.getById(id), enabled: !!id });

export const useCreateStudentContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentContactRequest) => studentContactApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentcontacts'] }),
  });
};

export const useUpdateStudentContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentContactRequest }) => studentContactApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentcontacts'] }),
  });
};

export const useDeleteStudentContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentContactApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentcontacts'] }),
  });
};


