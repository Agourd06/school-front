import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studentReportDetailApi,
  type StudentReportDetail,
  type GetStudentReportDetailsParams,
  type CreateStudentReportDetailPayload,
  type UpdateStudentReportDetailPayload,
} from '../api/studentReportDetail';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'studentReportDetails';

export const useStudentReportDetails = (
  params: GetStudentReportDetailsParams = {},
  options?: { enabled?: boolean }
) =>
  useQuery<PaginatedResponse<StudentReportDetail>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentReportDetailApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const useStudentReportDetail = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentReportDetailApi.getById(id),
    enabled: !!id,
  });

export const useCreateStudentReportDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentReportDetailPayload) => studentReportDetailApi.create(payload),
    onSuccess: (result: StudentReportDetail) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdateStudentReportDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentReportDetailPayload }) =>
      studentReportDetailApi.update(id, data),
    onSuccess: (result: StudentReportDetail) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteStudentReportDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentReportDetailApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


