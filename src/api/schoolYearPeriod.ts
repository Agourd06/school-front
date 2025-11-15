import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';
import { ensureCompanyId } from '../utils/companyScopedApi';

export interface SchoolYearPeriod {
  id: number;
  schoolYearId: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
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
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
  company_id?: number; // Optional - backend sets it from authenticated user
}

export interface UpdateSchoolYearPeriodRequest {
  schoolYearId?: number;
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: number | string;
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
  company_id?: number; // Optional - backend sets it from authenticated user
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
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify the school year belongs to the same company
    const body = ensureCompanyId(data);
    const response = await api.post('/school-year-periods', body);
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
      queryParams.append('title', s);
    }
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status.toString());
    if (rawParams.lifecycle_status) queryParams.append('lifecycle_status', rawParams.lifecycle_status);

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
      const schoolYearIdFilter = rawParams.schoolYearId;
      const lifecycleStatusFilter = rawParams.lifecycle_status;

      let filtered = items;
      
      // Filter by school year ID if provided
      if (schoolYearIdFilter !== undefined && schoolYearIdFilter !== null) {
        filtered = filtered.filter((it) => {
          const periodSchoolYearId = it.schoolYearId || it.schoolYear?.id;
          return periodSchoolYearId === Number(schoolYearIdFilter);
        });
      }
      
      // Filter by lifecycle_status if provided
      if (lifecycleStatusFilter) {
        filtered = filtered.filter((it) => {
          const periodLifecycleStatus = it.lifecycle_status || 'planned';
          return periodLifecycleStatus === lifecycleStatusFilter;
        });
      }
      
      // Filter by search term if provided
      if (s) {
        filtered = filtered.filter((it) => {
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
      // Always apply client-side filtering if we have schoolYearId filter, lifecycle_status filter, or search
      if (rawParams.schoolYearId !== undefined && rawParams.schoolYearId !== null || 
          rawParams.lifecycle_status || 
          params.search) {
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
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating schoolYearId, backend will verify the new school year belongs to the same company
    const body = ensureCompanyId(data);
    const response = await api.patch(`/school-year-periods/${id}`, body);
    return response.data;
  },

  delete: async (id: number): Promise<any> => {
    const response = await api.delete(`/school-year-periods/${id}`);
    return response.data;
  },
};

export default schoolYearPeriodApi;
