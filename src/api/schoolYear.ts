import api from './axios';
import type { PaginatedResponse, FilterParams } from '../types/api';

export interface SchoolYear {
  id: number;
  companyId: number;
  title: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: number;
  created_at?: string;
  updated_at?: string;
  company?: any;
  periods?: any[];
}

export interface CreateSchoolYearRequest {
  companyId: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
}

export interface UpdateSchoolYearRequest {
  companyId?: number;
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

export const schoolYearApi = {
  create: async (data: CreateSchoolYearRequest): Promise<SchoolYear> => {
    validateDates(data.start_date, data.end_date);
    const response = await api.post('/school-years', data);
    return response.data;
  },

  getAll: async (params: FilterParams = {}): Promise<PaginatedResponse<SchoolYear>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      // Some backends expect `search`, others expect `title`. Send both to be compatible.
      queryParams.append('search', s);
      queryParams.append('title', s);
    }
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/school-years?${queryString}` : '/school-years';

    const response = await api.get(url);
    console.log('SchoolYears API request params:', params);
    console.log('SchoolYears API request URL:', url);
    console.log('SchoolYears API response:', response.data);

    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    return response.data;
  },

  getById: async (id: number): Promise<SchoolYear> => {
    const response = await api.get(`/school-years/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateSchoolYearRequest): Promise<SchoolYear> => {
    validateDates(data.start_date, data.end_date);
    const response = await api.patch(`/school-years/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<any> => {
    const response = await api.delete(`/school-years/${id}`);
    return response.data;
  },
};

export default schoolYearApi;
