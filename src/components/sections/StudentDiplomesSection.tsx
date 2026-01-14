import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { EditButton, DeleteButton, Input, Button, PageHeader } from '../ui';
import { Award } from 'lucide-react';
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

const getStatusFilterOptions = (t: (key: string) => string): SearchSelectOption[] => [
  { value: 'all', label: t('sections.allStatuses') },
  ...STATUS_OPTIONS.filter((opt) => opt.value !== -2).map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
};

const StudentDiplomesSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

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
      setAlert({ type: 'success', message: t('messages.diplomeDeletedSuccessfully') });
      refetchDiplomes();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
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
        <PageHeader
          titleKey="pages.studentDiplomesTitle"
          descriptionKey="pages.studentDiplomesDescription"
          icon={<Award className="w-5 h-5" />}
          actions={
            <Button
              type="button"
              variant="primary"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('sections.addStudentDiplome')}
            </Button>
          }
        />
        {alert && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              alert.type === 'success'
                ? 'border-success-light bg-success-light text-success-dark'
                : 'border-danger-light bg-danger-light text-danger-dark'
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
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label={t('sections.student')}
            value={filters.student}
            onChange={handleFilterChange('student')}
            options={studentOptions}
            placeholder={t('sections.allStudents')}
            isClearable
          />
          <div>
            <Input
              label={t('common.search')}
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchByTitleSchoolCity')}
              className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.titleAndSchool')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.locationAndYear')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.images')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.loadingDiplomes')}
                  </td>
                </tr>
              ) : diplomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.noDiplomesFound')}
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
                        {diplome.annee && <div className="text-xs text-gray-500">{t('forms.year')}: {diplome.annee}</div>}
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
                          {t('sections.details')}
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
          currentPage={meta.page ?? 1}
          totalPages={meta.totalPages ?? 1}
          totalItems={meta.total ?? 0}
          itemsPerPage={meta.limit ?? 10}
          hasNext={meta.hasNext ?? false}
          hasPrevious={meta.hasPrevious ?? false}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
      </div>

      <StudentDiplomeModal isOpen={modalOpen} onClose={handleModalClose} item={editingDiplome ? { 
        ...editingDiplome, 
        status: editingDiplome.status ?? 1,
        diplome_picture_1: editingDiplome.diplome_picture_1 ?? undefined,
        diplome_picture_2: editingDiplome.diplome_picture_2 ?? undefined,
      } : undefined} />

      {detailsDiplome && (
        <StudentDiplomeDetailsModal isOpen={detailsModalOpen} onClose={closeDetailsModal} item={detailsDiplome} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deleteDiplome')}
        entityName={deleteTarget ? getDiplomeName(deleteTarget) : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDiplomeMut.isPending}
      />
    </div>
  );
};

export default StudentDiplomesSection;
