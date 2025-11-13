import React, { useEffect, useMemo, useState } from 'react';
import {
  useStudentAttestations,
  useCreateStudentAttestation,
  useUpdateStudentAttestation,
  useDeleteStudentAttestation,
} from '../../hooks/useStudentAttestations';
import { useStudents } from '../../hooks/useStudents';
import { useAttestations } from '../../hooks/useAttestations';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import StudentAttestationModal from '../modals/StudentAttestationModal';
import DeleteModal from '../modals/DeleteModal';
import type { StudentAttestation } from '../../api/studentAttestation';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const statusFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_OPTIONS.filter((opt) => opt.value !== -2).map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-200 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
};

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const StudentAttestationsSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    attestation: '',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentAttestation, setEditingStudentAttestation] = useState<StudentAttestation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentAttestation | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      Status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? Number(filters.status)
          : undefined,
      Idstudent: filters.student ? Number(filters.student) : undefined,
      Idattestation: filters.attestation ? Number(filters.attestation) : undefined,
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: studentAttestationsResp,
    isLoading,
    error,
    refetch: refetchStudentAttestations,
  } = useStudentAttestations(params);

  const studentAttestations = studentAttestationsResp?.data ?? [];
  const meta = studentAttestationsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createStudentAttestationMut = useCreateStudentAttestation();
  const updateStudentAttestationMut = useUpdateStudentAttestation();
  const deleteStudentAttestationMut = useDeleteStudentAttestation();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  const { data: attestationsResp } = useAttestations({ page: 1, limit: 100 } as any);

  const studentOptions = useMemo<SearchSelectOption[]>(
    () =>
      (studentsResp?.data || []).map((student: any) => ({
        value: student.id,
        label:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
          student.email ||
          `Student #${student.id}`,
      })),
    [studentsResp]
  );

  const attestationOptions = useMemo<SearchSelectOption[]>(
    () =>
      (attestationsResp?.data || []).map((attestation: any) => ({
        value: attestation.id,
        label: attestation.title || `Attestation #${attestation.id}`,
      })),
    [attestationsResp]
  );

  const openCreateModal = () => {
    setEditingStudentAttestation(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (studentAttestation: StudentAttestation) => {
    setEditingStudentAttestation(studentAttestation);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudentAttestation(null);
    setModalError(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleModalClose = () => {
    closeModal();
    refetchStudentAttestations();
  };

  const requestDelete = (studentAttestation: StudentAttestation) => {
    setDeleteTarget(studentAttestation);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteStudentAttestationMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Student attestation deleted successfully.' });
      refetchStudentAttestations();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStudentLabel = (sa: StudentAttestation) => {
    if (sa.student) {
      const name = `${sa.student.first_name ?? ''} ${sa.student.last_name ?? ''}`.trim();
      return name || sa.student.email || `Student #${sa.Idstudent}`;
    }
    return `Student #${sa.Idstudent}`;
  };

  const getAttestationLabel = (sa: StudentAttestation) => {
    return sa.attestation?.title || `Attestation #${sa.Idattestation}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Attestations</h1>
            <p className="text-sm text-gray-500">Manage student attestations and their associated details.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student Attestation
            </button>
          </div>
        </div>
        {alert && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              alert.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {alert.message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label="Student"
            value={filters.student}
            onChange={handleFilterChange('student')}
            options={studentOptions}
            placeholder="All students"
            isClearable
          />
          <SearchSelect
            label="Attestation"
            value={filters.attestation}
            onChange={handleFilterChange('attestation')}
            options={attestationOptions}
            placeholder="All attestations"
            isClearable
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by student or attestation..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Attestation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date Asked
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date Delivery
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading student attestations…
                  </td>
                </tr>
              ) : studentAttestations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No student attestations found.
                  </td>
                </tr>
              ) : (
                studentAttestations.map((sa) => {
                  const statusValue = typeof sa.Status === 'number' ? sa.Status : 0;
                  return (
                    <tr key={sa.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{getStudentLabel(sa)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getAttestationLabel(sa)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sa.dateask)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sa.datedelivery)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[statusValue] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[statusValue] ?? `Status ${statusValue}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(sa)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(sa)}
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
          hasNext={meta.hasNext}
          hasPrevious={meta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
      </div>

      <StudentAttestationModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        studentAttestation={editingStudentAttestation ?? undefined}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Student Attestation"
        entityName={deleteTarget ? `${getStudentLabel(deleteTarget)} - ${getAttestationLabel(deleteTarget)}` : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteStudentAttestationMut.isPending}
      />
    </div>
  );
};

export default StudentAttestationsSection;

