import { useQuery } from '@tanstack/react-query';
import {
  studentReportApi,
  type StudentReportDashboardParams,
  type StudentReportDashboardResponse,
} from '../api/studentReport';

const QUERY_KEY = 'studentReportDashboard';

export const useStudentReportDashboard = (
  params: StudentReportDashboardParams | null,
  options?: { enabled?: boolean }
) =>
  useQuery<StudentReportDashboardResponse>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => {
      if (!params) throw new Error('Missing dashboard params');
      return studentReportApi.getDashboard(params);
    },
    enabled: options?.enabled ?? Boolean(params),
  });


