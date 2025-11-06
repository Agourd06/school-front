import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  classStudentApi,
  type ClassStudentAssignment,
  type CreateClassStudentRequest,
  type UpdateClassStudentRequest,
  type GetClassStudentParams,
} from '../api/classStudent';

export const useClassStudents = (params: GetClassStudentParams = {}) =>
  useQuery({
    queryKey: ['classStudents', params],
    queryFn: () => classStudentApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useClassStudent = (id: number) =>
  useQuery({
    queryKey: ['classStudents', id],
    queryFn: () => classStudentApi.getById(id),
    enabled: !!id,
  });

export const useCreateClassStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassStudentRequest) => classStudentApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classStudents'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateClassStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassStudentRequest }) => classStudentApi.update(id, data),
    onSuccess: (_res: ClassStudentAssignment) => {
      qc.invalidateQueries({ queryKey: ['classStudents'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteClassStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classStudentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classStudents'] });
    },
  });
};


