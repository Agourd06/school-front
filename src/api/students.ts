import api from './axios';
import { ensureCompanyId } from '../utils/companyScopedApi';

export type Student = {
  id: number;
  gender?: string;
  first_name: string;
  last_name: string;
  birthday?: string; // YYYY-MM-DD
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  picture?: string;
  company_id?: number;
  class_room_id?: number;
  status?: number;
  classRoom?: {
    id: number;
    code: string;
    title: string;
    capacity: number;
  } | null;
  class_room?: {
    id: number;
    code: string;
    title: string;
    capacity: number;
  } | null;
  created_at: string;
  updated_at: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export type GetAllStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
  // company_id is automatically filtered by backend from JWT, no need to send it
  class_room_id?: number;
  status?: number;
};

export type CreateStudentRequest = Omit<Student, 'id' | 'created_at' | 'updated_at'>;
export type UpdateStudentRequest = Partial<CreateStudentRequest>;

export const studentsApi = {
  async getAll(params: GetAllStudentsParams = {}): Promise<Paginated<Student>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.search && params.search.trim()) qp.append('search', params.search.trim());
    // company_id is automatically filtered by backend from JWT token, no need to send it
    if (typeof params.class_room_id === 'number') qp.append('class_room_id', String(params.class_room_id));
    if (typeof params.status === 'number') qp.append('status', String(params.status));
    const qs = qp.toString();
    const url = qs ? `/students?${qs}` : '/students';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<Student> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async create(data: CreateStudentRequest | FormData): Promise<Student> {
    // Ensure company_id is set from authenticated user (backend will also set it, but we include it for consistency)
    // Backend will verify class room belongs to the same company (if provided)
    const payload = ensureCompanyId(data);
    const response = await api.post('/students', payload);
    return response.data;
  },

  async update(id: number, data: UpdateStudentRequest | FormData): Promise<Student> {
    // Ensure company_id is set from authenticated user (backend will verify it matches)
    // If updating class_room_id, backend will verify the class room belongs to the same company
    const payload = ensureCompanyId(data);
    const response = await api.patch(`/students/${id}`, payload);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  /**
   * Get student with all related data (diploma, contact, linkType) in one request
   * This endpoint returns singular objects (not arrays) for diploma, contact, and linkType
   * Returns null for diploma, contact, or linkType if they don't exist
   */
  async getDetails(id: number): Promise<{
    student: Student;
    diploma: {
      id: number;
      title: string;
      school: string;
      diplome?: string;
      annee?: number;
      country?: string;
      city?: string;
      diplome_picture_1?: string;
      diplome_picture_2?: string;
      student_id: number;
      status?: number;
      company_id?: number;
      created_at: string;
      updated_at: string;
    } | null;
    contact: {
      id: number;
      firstname: string;
      lastname: string;
      birthday?: string;
      email?: string;
      phone?: string;
      adress?: string;
      city?: string;
      country?: string;
      student_id: number;
      studentlinktypeId?: number;
      status?: number;
      company_id?: number;
      created_at: string;
      updated_at: string;
      studentLinkType?: {
        id: number;
        title: string;
        status?: number;
        company_id?: number;
        student_id?: number;
        created_at: string;
        updated_at: string;
      } | null;
    } | null;
    linkType: {
      id: number;
      title: string;
      status?: number;
      company_id?: number;
      student_id?: number;
      created_at: string;
      updated_at: string;
    } | null;
  }> {
    console.log('🔍 Fetching student details for ID:', id);
    const response = await api.get(`/students/${id}/details`);
    console.log('📥 API Raw Response:', response);
    console.log('📦 API Response Data:', response.data);
    console.log('🔑 API Response Data Keys:', Object.keys(response.data || {}));
    console.log('👤 Student ID in response:', response.data?.student?.id);
    console.log('📞 API Contact:', response.data?.contact);
    console.log('🔗 API LinkType:', response.data?.linkType);
    console.log('✅ Contact exists?', response.data?.contact !== null && response.data?.contact !== undefined);
    console.log('✅ LinkType exists?', response.data?.linkType !== null && response.data?.linkType !== undefined);
    return response.data;
  },
};

export default studentsApi;


