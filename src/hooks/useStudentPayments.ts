import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studentPaymentApi,
  type CreateStudentPaymentPayload,
  type GetStudentPaymentParams,
  type StudentPayment,
  type UpdateStudentPaymentPayload,
} from '../api/studentPayment';
import type { PaginatedResponse } from '../types/api';

const QUERY_KEY = 'studentPayments';

export const useStudentPayments = (params: GetStudentPaymentParams = {}) =>
  useQuery<PaginatedResponse<StudentPayment>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentPaymentApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useStudentPayment = (id: number) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentPaymentApi.getById(id),
    enabled: !!id,
  });

export const useCreateStudentPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPaymentPayload) => studentPaymentApi.create(payload),
    onSuccess: (result: StudentPayment) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useUpdateStudentPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentPaymentPayload }) =>
      studentPaymentApi.update(id, data),
    onSuccess: (result: StudentPayment) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.setQueryData([QUERY_KEY, result.id], result);
    },
  });
};

export const useDeleteStudentPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentPaymentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};


