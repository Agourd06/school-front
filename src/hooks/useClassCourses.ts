import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  classCourseApi,
  type ClassCourse,
  type CreateClassCoursePayload,
  type GetClassCourseParams,
  type UpdateClassCoursePayload,
} from '../api/classCourse';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'classCourses';

export const useClassCourses = (params: GetClassCourseParams = {}, options?: { enabled?: boolean }) =>
  useQuery<PaginatedResponse<ClassCourse>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => classCourseApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const useClassCourse = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => classCourseApi.getById(id),
    enabled: !!id,
  });

export const useCreateClassCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassCoursePayload) => classCourseApi.create(payload),
    onSuccess: (result: ClassCourse) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

// Batch creation endpoint removed - no longer supported

export const useUpdateClassCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClassCoursePayload }) => classCourseApi.update(id, data),
    onSuccess: (result: ClassCourse) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteClassCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classCourseApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


