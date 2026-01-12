import api from './axios';

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

export type GetStudentsWithoutReportParams = {
  school_year_id?: number;
  // Note: school_year_period_id is not supported by backend (database column doesn't exist)
  // Removed to prevent backend errors
  class_id?: number;
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
    // company_id is automatically set by backend from authenticated user - DO NOT send it
    // Backend will verify class room belongs to the same company (if provided)
    let payload: CreateStudentRequest | FormData;
    if (data instanceof FormData) {
      data.delete('company_id');
      payload = data;
    } else {
      const { company_id: _companyId, ...rest } = data;
      void _companyId;
      payload = rest as CreateStudentRequest;
    }
    const response = await api.post('/students', payload);
    return response.data;
  },

  async update(id: number, data: UpdateStudentRequest | FormData): Promise<Student> {
    // company_id is automatically set by backend from authenticated user - DO NOT send it
    // If updating class_room_id, backend will verify the class room belongs to the same company
    let payload: UpdateStudentRequest | FormData;
    if (data instanceof FormData) {
      data.delete('company_id');
      payload = data;
    } else {
      const { company_id: _companyId, ...rest } = data;
      void _companyId;
      payload = rest as UpdateStudentRequest;
    }
    const response = await api.patch(`/students/${id}`, payload);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async sendPasswordInvitation(id: number): Promise<{ message: string }> {
    const response = await api.post(`/students/${id}/send-password-invitation`);
    return response.data;
  },

  /**
   * Get all students without active reports
   * Returns a plain array (not paginated) of students that don't have any active student report
   * Automatically filtered by company_id from JWT token
   * Can be filtered by school_year_id and/or class_id
   * Note: school_year_period_id is NOT supported by backend (database column doesn't exist)
   */
  async getWithoutReport(params?: GetStudentsWithoutReportParams): Promise<Student[]> {
    const qp = new URLSearchParams();
    if (params?.school_year_id) qp.append('school_year_id', String(params.school_year_id));
    // Removed school_year_period_id - backend doesn't support it (causes database error)
    if (params?.class_id) qp.append('class_id', String(params.class_id));
    const qs = qp.toString();
    const url = qs ? `/students/without-report?${qs}` : '/students/without-report';
    const response = await api.get(url);
    return response.data;
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
    const response = await api.get(`/students/${id}/details`);
    return response.data;
  },

  /**
   * Get student with their active class and related data (specialization, level, schoolYear)
   * This endpoint is optimized for attestation generation
   */
  async getWithClass(id: number): Promise<{
    student: Student;
    class: {
      id: number;
      title: string;
      specialization: {
        id: number;
        title: string;
      } | null;
      level: {
        id: number;
        title: string;
      } | null;
      schoolYear: {
        id: number;
        title: string;
      } | null;
    } | null;
  }> {
    const response = await api.get(`/students/${id}/with-class`);
    return response.data;
  },
};

export default studentsApi;


