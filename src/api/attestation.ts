import api from './axios';
import type { FilterParams, PaginatedResponse } from '../types/api';
import { getCompanyId } from '../utils/companyId';

export interface Attestation {
  id: number;
  title: string;
  description?: string;
  statut?: number;
  companyid: number;
  created_at?: string;
  updated_at?: string;
  company?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateAttestationRequest {
  title: string;
  description?: string;
  statut?: number;
  companyid?: number; // Optional - backend sets it from authenticated user
}

export type UpdateAttestationRequest = Partial<CreateAttestationRequest>;

const toPaginated = (raw: unknown): PaginatedResponse<Attestation> => {
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
  const rawObj = raw as { meta?: { totalPages?: number; lastPage?: number; page?: number; limit?: number; total?: number; hasNext?: boolean; hasPrevious?: boolean }; data?: Attestation[] };
  const meta = rawObj?.meta || {};
  const rawData = rawObj?.data || [];
  const totalPages = meta.totalPages ?? meta.lastPage ?? 1;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? (Array.isArray(rawData) ? rawData.length : 10);
  return {
    data: Array.isArray(rawData) ? rawData : [],
    meta: {
      page,
      limit,
      total: meta.total ?? (Array.isArray(rawData) ? rawData.length : 0),
      totalPages,
      hasNext: meta.hasNext ?? page < totalPages,
      hasPrevious: meta.hasPrevious ?? page > 1,
    },
  };
};

export type GetAttestationsParams = FilterParams;

export const attestationApi = {
  async getAll(params: GetAttestationsParams = {}): Promise<PaginatedResponse<Attestation>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    if (params.status !== undefined && params.status !== null) qp.append('statut', String(params.status));
    // companyid is automatically filtered by backend from JWT token, no need to send it
    const qs = qp.toString();
    const url = qs ? `/attestation?${qs}` : '/attestation';
    const response = await api.get(url);
    return toPaginated(response.data);
  },

  async getById(id: number): Promise<Attestation> {
    const { data } = await api.get(`/attestation/${id}`);
    return data;
  },

  async create(payload: CreateAttestationRequest): Promise<Attestation> {
    // Ensure companyid is set from authenticated user (backend will also set it, but we include it for consistency)
    const companyId = getCompanyId();
    const body = {
      statut: 1,
      companyid: companyId,
      ...payload,
    };
    if (body.statut === undefined || body.statut === null) body.statut = 1;
    if (!body.companyid) body.companyid = companyId;
    const { data } = await api.post('/attestation', body);
    return data;
  },

  async update(id: number, payload: UpdateAttestationRequest): Promise<Attestation> {
    // Ensure companyid is set from authenticated user (backend will verify it matches)
    const companyId = getCompanyId();
    const body = {
      ...payload,
    };
    if (!('companyid' in body)) {
      (body as UpdateAttestationRequest & { companyid?: number }).companyid = companyId;
    }
    const { data } = await api.patch(`/attestation/${id}`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/attestation/${id}`);
  },
};


