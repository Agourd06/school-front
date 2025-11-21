import React, { useEffect, useMemo, useState } from 'react';
import {
  useStudentDiplomes,
  useDeleteStudentDiplome,
} from '../../hooks/useStudentDiplomes';
import { useStudents } from '../../hooks/useStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import { StudentDiplomeModal, StudentDiplomeDetailsModal } from '../modals';
import DeleteModal from '../modals/DeleteModal';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton, Input, Button } from '../ui';
import type { StudentDiplome } from '../../api/studentDiplome';
import type { Student } from '../../api/students';
import { STATUS_OPTIONS } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';

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

const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'Unexpected error';
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return 'Unexpected error';
};

const StudentDiplomesSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingDiplome, setEditingDiplome] = useState<StudentDiplome | null>(null);
  const [detailsDiplome, setDetailsDiplome] = useState<StudentDiplome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentDiplome | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? Number(filters.status)
          : undefined,
      student_id: filters.student ? Number(filters.student) : undefined,
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: diplomesResp,
    isLoading,
    error,
    refetch: refetchDiplomes,
  } = useStudentDiplomes(params);

  const diplomes = diplomesResp?.data ?? [];
  const meta = diplomesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteDiplomeMut = useDeleteStudentDiplome();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 });

  const studentOptions = useMemo<SearchSelectOption[]>(
    () =>
      (studentsResp?.data || []).map((student: Student) => ({
        value: student.id,
        label:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
          student.email ||
          `Student #${student.id}`,
      })),
    [studentsResp]
  );

  const openCreateModal = () => {
    setEditingDiplome(null);
    setModalOpen(true);
  };

  const openEditModal = (diplome: StudentDiplome) => {
    setEditingDiplome(diplome);
    setModalOpen(true);
  };

  const openDetailsModal = (diplome: StudentDiplome) => {
    setDetailsDiplome(diplome);
    setDetailsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDiplome(null);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsDiplome(null);
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
    refetchDiplomes();
  };

  const requestDelete = (diplome: StudentDiplome) => {
    setDeleteTarget(diplome);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteDiplomeMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Diplome deleted successfully.' });
      refetchDiplomes();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const getDiplomeName = (diplome: StudentDiplome) => {
    return [diplome.title, diplome.school].filter(Boolean).join(' — ') || `Diplome #${diplome.id}`;
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Diplomes</h1>
            <p className="text-sm text-gray-500">Manage student diplomes and certificates.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Diplome
            </Button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div>
            <Input
              label="Search"
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by title, school, city..."
              className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title & School
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location & Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Images
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
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading diplomes…
                  </td>
                </tr>
              ) : diplomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No diplomes found.
                  </td>
                </tr>
              ) : (
                diplomes.map((diplome) => (
                  <tr key={diplome.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {diplome.title} — {diplome.school}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="space-y-1">
                        {diplome.city || diplome.country ? (
                          <div>
                            {diplome.city || ''}
                            {diplome.city && diplome.country ? ', ' : ''}
                            {diplome.country || ''}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {diplome.annee && <div className="text-xs text-gray-500">Year: {diplome.annee}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        {diplome.diplome_picture_1 && (
                          <img
                            src={getFileUrl(diplome.diplome_picture_1)}
                            alt="diplome 1"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        )}
                        {diplome.diplome_picture_2 && (
                          <img
                            src={getFileUrl(diplome.diplome_picture_2)}
                            alt="diplome 2"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        )}
                        {!diplome.diplome_picture_1 && !diplome.diplome_picture_2 && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <StatusBadge value={diplome.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetailsModal(diplome)}
                          className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
                        >
                          Details
                        </button>
                        <EditButton onClick={() => openEditModal(diplome)} />
                        <DeleteButton onClick={() => requestDelete(diplome)} />
                      </div>
                    </td>
                  </tr>
                ))
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

      <StudentDiplomeModal isOpen={modalOpen} onClose={handleModalClose} item={editingDiplome ?? undefined} />

      {detailsDiplome && (
        <StudentDiplomeDetailsModal isOpen={detailsModalOpen} onClose={closeDetailsModal} item={detailsDiplome} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Diplome"
        entityName={deleteTarget ? getDiplomeName(deleteTarget) : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDiplomeMut.isPending}
      />
    </div>
  );
};

export default StudentDiplomesSection;
