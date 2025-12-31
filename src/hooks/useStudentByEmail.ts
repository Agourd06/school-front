import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../api/students';

/**
 * Hook to find a student by email
 * This is used to get the student ID from the user's email
 */
export const useStudentByEmail = (email: string | undefined) => {
  return useQuery({
    queryKey: ['studentByEmail', email],
    queryFn: async () => {
      if (!email) return null;
      // Search for students with this email
      const response = await studentsApi.getAll({ search: email, limit: 1 });
      const students = response.data;
      // Find exact email match
      const student = students.find((s) => s.email.toLowerCase() === email.toLowerCase());
      return student || null;
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

