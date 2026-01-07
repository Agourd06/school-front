import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSchoolYears,
  useDeleteSchoolYear,
} from '../../hooks/useSchoolYears';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import SchoolYearModal from '../modals/SchoolYearModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Input, Button } from '../ui';
import type { SchoolYear } from '../../api/schoolYear';
import { STATUS_OPTIONS } from '../../constants/status';
import { useSchoolYear } from '../../context/SchoolYearContext';

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
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const getLifecycleStatusFilterOptions = (t: (key: string) => string): SearchSelectOption[] => [
  { value: 'all', label: t('sections.allLifecycleStatuses') },
  { value: 'planned', label: t('sections.planned') },
  { value: 'ongoing', label: t('sections.ongoing') },
  { value: 'completed', label: t('sections.completed') },
];

const lifecycleRowBgStyles: Record<string, string> = {
  ongoing: 'bg-green-100 hover:bg-green-200',
  planned: 'bg-orange-100 hover:bg-orange-200',
  completed: 'bg-gray-200 hover:bg-gray-300',
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

const SchoolYearsSection: React.FC = () => {
  const { t } = useTranslation();
  const { setSelectedSchoolYearId, navigateToPeriods } = useSchoolYear();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    lifecycle_status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);
  const lifecycleStatusFilterOptions = useMemo(() => getLifecycleStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchoolYear, setEditingSchoolYear] = useState<SchoolYear | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolYear | null>(null);
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
      lifecycle_status:
        filters.lifecycle_status === 'all' ? undefined : (filters.lifecycle_status as 'planned' | 'ongoing' | 'completed' | undefined),
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: schoolYearsResp,
    isLoading,
    error,
    refetch: refetchSchoolYears,
  } = useSchoolYears(params);

  // Check for ongoing school years to show warning
  const {
    data: ongoingYearsResp,
  } = useSchoolYears({ lifecycle_status: 'ongoing', limit: 100 });

  const schoolYears = schoolYearsResp?.data ?? [];
  const meta = schoolYearsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };
  const ongoingYears = ongoingYearsResp?.data ?? [];
  const hasNoOngoingYears = ongoingYears.length === 0;

  const deleteSchoolYearMut = useDeleteSchoolYear();

  const openCreateModal = () => {
    setEditingSchoolYear(null);
    setModalOpen(true);
  };

  const openEditModal = (schoolYear: SchoolYear) => {
    setEditingSchoolYear(schoolYear);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSchoolYear(null);
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
    refetchSchoolYears();
  };

  const requestDelete = (schoolYear: SchoolYear) => {
    setDeleteTarget(schoolYear);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteSchoolYearMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.schoolYearDeletedSuccessfully') });
      refetchSchoolYears();
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handleRowClick = (schoolYear: SchoolYear, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('td:last-child')) {
      return;
    }
    navigateToPeriods(schoolYear.id);
  };

  return (
    <div className="space-y-6">
      
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('sidebar.schoolYears')}</h1>
            <p className="text-sm text-gray-500">{t('sections.manageSchoolYears')}</p>
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
              {t('sections.addSchoolYear')}
            </Button>
          </div>
        </div>
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
        {hasNoOngoingYears && (
          <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">{t('sections.warningNoOngoingSchoolYear')}</p>
                <p>{t('sections.recommendOngoingSchoolYear')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label={t('sections.lifecycleStatus')}
            value={filters.lifecycle_status}
            onChange={handleFilterChange('lifecycle_status')}
            options={lifecycleStatusFilterOptions}
            isClearable={false}
          />
          <div className="md:col-span-2">
            <Input
              label={t('common.search')}
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchBySchoolYearTitle')}
              className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.startDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.endDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.lifecycleStatus')}
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
                    {t('sections.loadingSchoolYears')}
                  </td>
                </tr>
              ) : schoolYears.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.noSchoolYearsFound')}
                  </td>
                </tr>
              ) : (
                schoolYears.map((schoolYear) => {
                  const lifecycleStatus = schoolYear.lifecycle_status || 'planned';
                  const rowBgClass = lifecycleRowBgStyles[lifecycleStatus] || 'bg-white hover:bg-gray-50';
                  return (
                    <tr
                      key={schoolYear.id}
                      className={`${rowBgClass} cursor-pointer`}
                      onClick={(e) => handleRowClick(schoolYear, e)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{schoolYear.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(schoolYear.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(schoolYear.end_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                          {t(`sections.${schoolYear.lifecycle_status || 'planned'}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSchoolYearId(schoolYear.id);
                              if (navigateToPeriods) {
                                navigateToPeriods();
                              }
                            }}
                            className="inline-flex items-center rounded-md border border-primary-light px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                            title={t('sections.viewPeriods')}
                          >
                          
                            {t('sections.periods')}
                          </button>
                          <EditButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(schoolYear);
                            }}
                          />
                          <DeleteButton
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(schoolYear);
                            }}
                          />
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
          totalPages={(meta as { totalPages?: number; lastPage?: number }).totalPages ?? (meta as { totalPages?: number; lastPage?: number }).lastPage ?? 1}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
          hasNext={(meta as { hasNext?: boolean; totalPages?: number; lastPage?: number }).hasNext ?? (meta.page < (((meta as { totalPages?: number; lastPage?: number }).totalPages ?? (meta as { totalPages?: number; lastPage?: number }).lastPage) ?? 1))}
          hasPrevious={(meta as { hasPrevious?: boolean }).hasPrevious ?? meta.page > 1}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
      </div>

      <SchoolYearModal isOpen={modalOpen} onClose={handleModalClose} schoolYear={editingSchoolYear} />

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deleteSchoolYear')}
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteSchoolYearMut.isPending}
      />
    </div>
  );
};

export default SchoolYearsSection;
