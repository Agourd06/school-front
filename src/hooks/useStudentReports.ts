import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studentReportApi,
  type GetStudentReportsParams,
  type StudentReport,
  type CreateStudentReportPayload,
  type UpdateStudentReportPayload,
} from '../api/studentReport';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'studentReports';

export const useStudentReports = (params: GetStudentReportsParams = {}) =>
  useQuery<PaginatedResponse<StudentReport>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentReportApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useStudentReport = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentReportApi.getById(id),
    enabled: !!id,
  });

export const useCreateStudentReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentReportPayload) => studentReportApi.create(payload),
    onSuccess: (result: StudentReport) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdateStudentReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentReportPayload }) => studentReportApi.update(id, data),
    onSuccess: (result: StudentReport) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteStudentReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentReportApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


