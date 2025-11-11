import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studentPresenceApi,
  type CreateStudentPresencePayload,
  type GetStudentPresenceParams,
  type StudentPresence,
  type UpdateStudentPresencePayload,
} from '../api/studentPresence';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'studentPresence';

export const useStudentPresences = (params: GetStudentPresenceParams = {}) =>
  useQuery<PaginatedResponse<StudentPresence>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentPresenceApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useStudentPresence = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentPresenceApi.getById(id),
    enabled: !!id,
  });

export const useCreateStudentPresence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPresencePayload) => studentPresenceApi.create(payload),
    onSuccess: (result: StudentPresence) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdateStudentPresence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentPresencePayload }) =>
      studentPresenceApi.update(id, data),
    onSuccess: (result: StudentPresence) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteStudentPresence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentPresenceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

