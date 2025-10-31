import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers';
import type { CreateTeacherRequest, UpdateTeacherRequest, GetAllTeachersParams } from '../api/teachers';

export const useTeachers = (params: GetAllTeachersParams = {}) => {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teachersApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useTeacher = (id: number) => {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeacherRequest) => teachersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
};

export const useUpdateTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTeacherRequest & { id: number }) => teachersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
};

export const useDeleteTeacher = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teachersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
};

export default useTeachers;


