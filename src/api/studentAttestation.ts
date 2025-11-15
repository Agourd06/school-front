import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { getCompanyId } from '../utils/companyId';

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
  companyid?: number; // Optional - backend sets it from authenticated user
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
  // companyid is automatically filtered by backend from JWT, no need to send it
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
    // companyid is automatically filtered by backend from JWT token, no need to send it
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
    // Ensure companyid is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify student and attestation belong to the same company
    // Note: This API uses 'companyid' (no underscore) instead of 'company_id'
    const companyId = getCompanyId();
    const body = {
      Status: 1,
      companyid: companyId,
      ...payload,
    };
    if (body.Status === undefined || body.Status === null) body.Status = 1;
    if (!body.companyid) body.companyid = companyId;
    const { data } = await api.post('/studentattestation', body);
    return data;
  },

  async update(id: number, payload: UpdateStudentAttestationRequest): Promise<StudentAttestation> {
    // Ensure companyid is set from authenticated user (backend will verify it matches)
    // If updating student or attestation, backend will verify they belong to the same company
    // Note: This API uses 'companyid' (no underscore) instead of 'company_id'
    const companyId = getCompanyId();
    const body = {
      ...payload,
    };
    if (!('companyid' in body)) (body as any).companyid = companyId;
    const { data } = await api.patch(`/studentattestation/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/studentattestation/${id}`);
  },
};


