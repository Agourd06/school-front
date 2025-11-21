import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentLinkTypeApi, type CreateStudentLinkTypeRequest, type UpdateStudentLinkTypeRequest, type GetAllStudentLinkTypeParams } from '../api/studentLinkType';

export const useStudentLinkTypes = (params: GetAllStudentLinkTypeParams = {}) =>
  useQuery({ queryKey: ['studentlinktypes', params], queryFn: () => studentLinkTypeApi.getAll(params) });

export const useStudentLinkType = (id: number) =>
  useQuery({ queryKey: ['studentlinktypes', id], queryFn: () => studentLinkTypeApi.getById(id), enabled: !!id });

export const useCreateStudentLinkType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentLinkTypeRequest) => studentLinkTypeApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentlinktypes'] }),
  });
};

export const useUpdateStudentLinkType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentLinkTypeRequest }) => studentLinkTypeApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentlinktypes'] }),
  });
};

export const useDeleteStudentLinkType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentLinkTypeApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentlinktypes'] }),
  });
};


