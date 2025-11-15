import api from './axios';
import { getCompanyId } from '../utils/companyId';

export interface SchoolYear {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
  company?: {
    id: number;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  // Add these for frontend compatibility
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface GetAllSchoolYearsResponse {
  data: SchoolYear[];
  meta: Meta;
}

export interface GetAllSchoolYearsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
}

export interface CreateSchoolYearRequest {
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  companyId?: number; // Optional - backend sets it from authenticated user
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
}

export interface UpdateSchoolYearRequest {
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: number;
  companyId?: number; // Optional - backend sets it from authenticated user
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
}

export const schoolYearApi = {
  async getAll(params?: GetAllSchoolYearsParams): Promise<GetAllSchoolYearsResponse> {
    // Normalize query: backend supports `title` for search; send both
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search && params.search.trim()) {
      const s = params.search.trim();
      queryParams.append('title', s);
    }
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.lifecycle_status) queryParams.append('lifecycle_status', params.lifecycle_status);

    const qs = queryParams.toString();
    const url = qs ? `/school-years?${qs}` : '/school-years';
    const response = await api.get(url);
    const resData = response.data;

    const total = resData.meta?.total ?? 0;
    const page = resData.meta?.page ?? 1;
    const limit = resData.meta?.limit ?? 10;
    const lastPage = resData.meta?.lastPage ?? 1;

    return {
      data: resData.data || [],
      meta: {
        total,
        page,
        limit,
        lastPage,
        // Frontend pagination compatibility
        totalPages: lastPage,
        hasNext: page < lastPage,
        hasPrevious: page > 1,
      },
    };
  },

  async getById(id: number): Promise<SchoolYear> {
    const response = await api.get(`/school-years/${id}`);
    return response.data;
  },

  async create(data: CreateSchoolYearRequest) {
    // Ensure companyId is set from authenticated user (backend will also set it, but we include it for consistency)
    const companyId = getCompanyId();
    const body = {
      ...data,
      companyId, // Backend uses camelCase for companyId
    };
    const response = await api.post('/school-years', body);
    return response.data;
  },

  async update(id: number, data: UpdateSchoolYearRequest) {
    // Ensure companyId is set from authenticated user (backend will verify it matches)
    const companyId = getCompanyId();
    const body = {
      ...data,
      companyId, // Backend uses camelCase for companyId
    };
    const response = await api.patch(`/school-years/${id}`, body);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/school-years/${id}`);
    return response.data;
  },
};
