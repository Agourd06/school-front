import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

export interface SchoolYearPeriod {
  id: number;
  schoolYearId: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  created_at?: string;
  updated_at?: string;
  schoolYear?: any;
}

export interface CreateSchoolYearPeriodRequest {
  schoolYearId: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
}

export interface UpdateSchoolYearPeriodRequest {
  schoolYearId?: number;
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: number | string;
}

function validateDates(start?: string, end?: string) {
  if (!start || !end) return;
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e)) throw new Error('Invalid date format');
  if (e <= s) throw new Error('end_date must be greater than start_date');
}

export const schoolYearPeriodApi = {
  create: async (data: CreateSchoolYearPeriodRequest): Promise<SchoolYearPeriod> => {
    validateDates(data.start_date, data.end_date);
    const response = await api.post('/school-year-periods', data);
    return response.data;
  },

  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<SchoolYearPeriod>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    const rawParams: any = params as any;
    const searchVal = (rawParams.title ?? rawParams.search) as string | undefined;
    if (searchVal && searchVal.trim()) {
      const s = searchVal.trim();
      queryParams.append('search', s);
      queryParams.append('title', s);
    }
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/school-year-periods?${queryString}` : '/school-year-periods';

    const response = await api.get(url);
    console.log('SchoolYearPeriods API request params:', params);
    console.log('SchoolYearPeriods API request URL:', url);
    console.log('SchoolYearPeriods API response:', response.data);

    const applyClientFilterAndPaginate = (items: any[]) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const s = params.search?.toLowerCase().trim();

      let filtered = items;
      if (s) {
        filtered = items.filter((it) => {
          const title = (it.title || '').toString().toLowerCase();
          const parentTitle = (it.schoolYear?.title || '').toString().toLowerCase();
          return title.includes(s) || parentTitle.includes(s);
        });
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return {
        data: paged,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    };

    if (Array.isArray(response.data)) {
      return applyClientFilterAndPaginate(response.data);
    }

    if (response.data && Array.isArray(response.data.data)) {
      if (params.search) {
        return applyClientFilterAndPaginate(response.data.data as any[]);
      }
      return response.data;
    }

    return response.data;
  },

  getById: async (id: number): Promise<SchoolYearPeriod> => {
    const response = await api.get(`/school-year-periods/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateSchoolYearPeriodRequest): Promise<SchoolYearPeriod> => {
    validateDates(data.start_date, data.end_date);
    const response = await api.patch(`/school-year-periods/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<any> => {
    const response = await api.delete(`/school-year-periods/${id}`);
    return response.data;
  },
};

export default schoolYearPeriodApi;
