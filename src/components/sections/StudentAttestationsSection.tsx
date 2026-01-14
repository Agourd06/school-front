import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useStudentAttestations,
  useDeleteStudentAttestation,
} from '../../hooks/useStudentAttestations';
import { useStudents } from '../../hooks/useStudents';
import { useAttestations } from '../../hooks/useAttestations';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import StudentAttestationModal from '../modals/StudentAttestationModal';
import DeleteModal from '../modals/DeleteModal';
import BaseModal from '../modals/BaseModal';
import { EditButton, DeleteButton, Button, PageHeader } from '../ui';
import { FileCheck } from 'lucide-react';
import type { StudentAttestation } from '../../api/studentAttestation';
import type { Attestation } from '../../api/attestation';
import type { Student } from '../../api/students';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';

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

const statusStyles: Record<number, string> = {
  2: 'bg-warning-badge',
  1: 'bg-success-badge',
  0: 'bg-muted-badge',
  [-1]: 'bg-accent-badge',
  [-2]: 'bg-danger-badge',
};

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
};

const StudentAttestationsSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    attestation: '',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentAttestation, setEditingStudentAttestation] = useState<StudentAttestation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentAttestation | null>(null);
  const [detailsAttestation, setDetailsAttestation] = useState<StudentAttestation | null>(null);
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

  const deleteStudentAttestationMut = useDeleteStudentAttestation();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 });
  const { data: attestationsResp } = useAttestations({ page: 1, limit: 100 });

  const studentOptions = useMemo<SearchSelectOption[]>(
    () =>
      (studentsResp?.data || []).map((student: Student) => ({
        value: student.id,
        label:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
          student.email ||
          `${t('forms.studentNumber')}${student.id}`,
      })),
    [studentsResp, t]
  );

  const attestationOptions = useMemo<SearchSelectOption[]>(
    () =>
      (attestationsResp?.data || []).map((attestation: Attestation) => ({
        value: attestation.id,
        label: attestation.title || `${t('forms.attestationNumber')}${attestation.id}`,
      })),
    [attestationsResp, t]
  );

  const openCreateModal = () => {
    setEditingStudentAttestation(null);
    setModalOpen(true);
  };

  const openEditModal = (studentAttestation: StudentAttestation) => {
    setEditingStudentAttestation(studentAttestation);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudentAttestation(null);
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

  const openDetailsModal = (studentAttestation: StudentAttestation) => {
    setDetailsAttestation(studentAttestation);
  };

  const closeDetailsModal = () => {
    setDetailsAttestation(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteStudentAttestationMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.studentAttestationDeletedSuccessfully') });
      refetchStudentAttestations();
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
      return name || sa.student.email || `${t('forms.studentNumber')}${sa.Idstudent}`;
    }
    return `${t('forms.studentNumber')}${sa.Idstudent}`;
  };

  const getAttestationLabel = (sa: StudentAttestation) => {
    return sa.attestation?.title || `${t('forms.attestationNumber')}${sa.Idattestation}`;
  };

  return (
    <div className="space-y-6">
        <PageHeader
          titleKey="pages.studentAttestationsTitle"
          descriptionKey="pages.studentAttestationsDescription"
          icon={<FileCheck className="w-5 h-5" />}
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
              {t('sections.addStudentAttestation')}
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
      

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-body">
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label={t('sidebar.students')}
            value={filters.student}
            onChange={handleFilterChange('student')}
            options={studentOptions}
            placeholder={t('sections.allStudents')}
            isClearable
          />
          <SearchSelect
            label={t('sidebar.attestations')}
            value={filters.attestation}
            onChange={handleFilterChange('attestation')}
            options={attestationOptions}
            placeholder={t('sections.allAttestations')}
            isClearable
          />
          <div>
            <label className="block text-sm font-medium text-heading">{t('common.search')}</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchByStudentOrAttestation')}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>
        </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.student')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sidebar.attestations')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.dateAsked')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.dateDelivery')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.loadingStudentAttestations')}
                  </td>
                </tr>
              ) : studentAttestations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.noStudentAttestationsFound')}
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
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sa.datedelivery ?? undefined)}</td>
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
                            onClick={() => openDetailsModal(sa)}
                            className="inline-flex items-center rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            {t('common.attestation')}
                          </button>
                          <EditButton onClick={() => openEditModal(sa)} />
                          <DeleteButton onClick={() => requestDelete(sa)} />
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
        studentAttestation={editingStudentAttestation ? {
          ...editingStudentAttestation,
          Status: editingStudentAttestation.Status ?? 1,
          student: editingStudentAttestation.student ? { id: editingStudentAttestation.student.id } : undefined,
          attestation: editingStudentAttestation.attestation ? { id: editingStudentAttestation.attestation.id } : undefined,
        } : undefined}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('forms.deleteStudentAttestation')}
        entityName={deleteTarget ? `${getStudentLabel(deleteTarget)} - ${getAttestationLabel(deleteTarget)}` : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteStudentAttestationMut.isPending}
      />

      {detailsAttestation && (
        <BaseModal
          isOpen
          onClose={closeDetailsModal}
          title={`${t('forms.attestationDetails')}: ${getAttestationLabel(detailsAttestation)}`}
          className="sm:max-w-3xl"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('common.student')}</h3>
              <p className="text-gray-700">{getStudentLabel(detailsAttestation)}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('common.attestation')}</h3>
              <p className="text-gray-700">{getAttestationLabel(detailsAttestation)}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('forms.requestNotes')}</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      detailsAttestation.description?.trim()
                        ? detailsAttestation.description
                        : `<p class="text-gray-500 italic">${t('forms.noNotesProvided')}</p>`,
                  }}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('forms.attestationTemplate')}</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      detailsAttestation.attestation?.description?.trim()
                        ? detailsAttestation.attestation.description
                        : `<p class="text-gray-500 italic">${t('forms.noTemplateDescriptionAvailable')}</p>`,
                  }}
                />
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default StudentAttestationsSection;

