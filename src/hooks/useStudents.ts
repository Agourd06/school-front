import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentsApi } from '../api/students';
import type { CreateStudentRequest, UpdateStudentRequest, GetAllStudentsParams } from '../api/students';

export const useStudents = (params: GetAllStudentsParams = {}) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useStudent = (id: number) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentRequest) => studentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateStudentRequest & { id: number }) => studentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export default useStudents;
