import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classroomTypeApi, type CreateClassroomTypeRequest, type UpdateClassroomTypeRequest, type GetAllClassroomTypeParams } from '../api/classroomType';

export const useClassroomTypes = (params: GetAllClassroomTypeParams = {}) =>
  useQuery({ queryKey: ['classroomtypes', params], queryFn: () => classroomTypeApi.getAll(params) });

export const useClassroomType = (id: number) =>
  useQuery({ queryKey: ['classroomtypes', id], queryFn: () => classroomTypeApi.getById(id), enabled: !!id });

export const useCreateClassroomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassroomTypeRequest) => classroomTypeApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroomtypes'] }),
  });
};

export const useUpdateClassroomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassroomTypeRequest }) => classroomTypeApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroomtypes'] }),
  });
};

export const useDeleteClassroomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classroomTypeApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroomtypes'] }),
  });
};

