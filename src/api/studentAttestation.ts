import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { DEFAULT_COMPANY_ID } from '../constants/status';

export interface StudentAttestation {
  id: number;
  Idstudent: number;
  Idattestation: number;
  dateask?: string;
  datedelivery?: string;
  Status?: number;
  companyid: number;
  created_at?: string;
  updated_at?: string;
  student?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  attestation?: {
    id: number;
    title: string;
    description?: string;
  } | null;
  company?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateStudentAttestationRequest {
  Idstudent: number;
  Idattestation: number;
  dateask?: string;
  datedelivery?: string;
  Status?: number;
  companyid: number;
}

export type UpdateStudentAttestationRequest = Partial<CreateStudentAttestationRequest>;

const toPaginated = (raw: any): PaginatedResponse<StudentAttestation> => {
  if (Array.isArray(raw)) {
    return {
      data: raw,
      meta: {
        page: 1,
        limit: raw.length,
        total: raw.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  const meta = raw?.meta || {};
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(raw?.data) ? raw.data.length : 10);
  return {
    data: raw?.data || [],
    meta: {
      page,
      limit,
      total: meta.total ?? (Array.isArray(raw?.data) ? raw.data.length : 0),
      totalPages,
      hasNext: meta.hasNext ?? page < totalPages,
      hasPrevious: meta.hasPrevious ?? page > 1,
    },
  };
};

export interface GetStudentAttestationsParams extends FilterParams {
  Idstudent?: number;
  Idattestation?: number;
  companyid?: number;
  Status?: number;
}

export const studentAttestationApi = {
  async getAll(params: GetStudentAttestationsParams = {}): Promise<PaginatedResponse<StudentAttestation>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.Status !== undefined && params.Status !== null) qp.append('Status', String(params.Status));
    if (params.Idstudent) qp.append('Idstudent', String(params.Idstudent));
    if (params.Idattestation) qp.append('Idattestation', String(params.Idattestation));
    if (params.companyid) qp.append('companyid', String(params.companyid));
    const qs = qp.toString();
    const url = qs ? `/studentattestation?${qs}` : '/studentattestation';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<StudentAttestation> {
    const { data } = await api.get(`/studentattestation/${id}`);
    return data;
  },

  async create(payload: CreateStudentAttestationRequest): Promise<StudentAttestation> {
    const body = {
      Status: 1,
      companyid: DEFAULT_COMPANY_ID,
      ...payload,
    };
    if (body.Status === undefined || body.Status === null) body.Status = 1;
    if (!body.companyid) body.companyid = DEFAULT_COMPANY_ID;
    const { data } = await api.post('/studentattestation', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentAttestationRequest): Promise<StudentAttestation> {
    const body = {
      ...payload,
    };
    if (!('companyid' in body)) (body as any).companyid = DEFAULT_COMPANY_ID;
    const { data } = await api.patch(`/studentattestation/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/studentattestation/${id}`);
  },
};


