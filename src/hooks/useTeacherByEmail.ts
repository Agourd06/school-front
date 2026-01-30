import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers';

/**
 * Hook to find a teacher by email
 * This is used to get the teacher ID from the user's email
 */
export const useTeacherByEmail = (email: string | undefined) => {
  return useQuery({
    queryKey: ['teacherByEmail', email],
    queryFn: async () => {
      if (!email) return null;
      const response = await teachersApi.getAll({ search: email, limit: 1 });
      const teachers = response.data;
      const teacher = teachers.find((t) => t.email.toLowerCase() === email.toLowerCase());
      return teacher || null;
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

