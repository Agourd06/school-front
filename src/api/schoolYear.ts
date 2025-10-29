import api from './axios';

export interface SchoolYear {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
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
}

export interface CreateSchoolYearRequest {
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  companyId: number;
}

export interface UpdateSchoolYearRequest {
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: number;
  companyId?: number;
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
    const response = await api.post('/school-years', data);
    return response.data;
  },

  async update(id: number, data: UpdateSchoolYearRequest) {
    const response = await api.patch(`/school-years/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/school-years/${id}`);
    return response.data;
  },
};
