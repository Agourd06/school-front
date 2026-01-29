import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  teacherCourseApi,
  type TeacherCourse,
  type CreateTeacherCoursePayload,
  type GetTeacherCourseParams,
  type UpdateTeacherCoursePayload,
} from '../api/teacherCourse';
import type { PaginatedResponse } from '../types/api';
import type { Teacher } from '../api/teachers';

const QUERY_KEY = 'teacherCourses';

export const useTeacherCourses = (params: GetTeacherCourseParams = {}, options?: { enabled?: boolean }) =>
  useQuery<PaginatedResponse<TeacherCourse>>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => teacherCourseApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const useTeachersByCourse = (courseId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery<Teacher[]>({
    queryKey: [QUERY_KEY, 'course', courseId, 'teachers'],
    queryFn: () => teacherCourseApi.getTeachersByCourse(courseId!),
    enabled: (options?.enabled ?? true) && !!courseId,
  });

export const useTeacherCourse = (teacherId: number, courseId: number) =>
  useQuery({
    queryKey: [QUERY_KEY, teacherId, courseId],
    queryFn: () => teacherCourseApi.getById(teacherId, courseId),
    enabled: !!teacherId && !!courseId,
  });

export const useCreateTeacherCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherCoursePayload) => teacherCourseApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useUpdateTeacherCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, courseId, data }: { teacherId: number; courseId: number; data: UpdateTeacherCoursePayload }) =>
      teacherCourseApi.update(teacherId, courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useDeleteTeacherCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, courseId }: { teacherId: number; courseId: number }) =>
      teacherCourseApi.delete(teacherId, courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
