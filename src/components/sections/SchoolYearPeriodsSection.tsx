import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSchoolYearPeriods,
 
  useDeleteSchoolYearPeriod,
} from '../../hooks/useSchoolYearPeriods';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import SchoolYearPeriodModal from '../modals/SchoolYearPeriodModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Button, PageHeader } from '../ui';
import { CalendarDays } from 'lucide-react';
import type { SchoolYearPeriod } from '../../api/schoolYearPeriod';
import { STATUS_OPTIONS } from '../../constants/status';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { useSchoolYear as useSchoolYearById } from '../../hooks/useSchoolYears';

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

const SchoolYearPeriodsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedSchoolYearId } = useSchoolYear();
  const { data: selectedSchoolYear } = useSchoolYearById(selectedSchoolYearId || 0);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    lifecycle_status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);
  const lifecycleStatusFilterOptions = useMemo(() => getLifecycleStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SchoolYearPeriod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolYearPeriod | null>(null);
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
      schoolYearId: selectedSchoolYearId ?? undefined,
    }),
    [filters, pagination, selectedSchoolYearId]
  );

  const {
    data: periodsResp,
    isLoading,
    error,
    refetch: refetchPeriods,
  } = useSchoolYearPeriods(params);

  // Check for ongoing periods for the selected school year
  const {
    data: ongoingPeriodsResp,
  } = useSchoolYearPeriods({
    schoolYearId: selectedSchoolYearId ?? undefined,
    lifecycle_status: 'ongoing',
    limit: 100,
  });

  const periods = periodsResp?.data ?? [];
  const meta = periodsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };
  const ongoingPeriods = ongoingPeriodsResp?.data ?? [];
  const hasNoOngoingPeriods = selectedSchoolYearId !== null && selectedSchoolYearId !== undefined && ongoingPeriods.length === 0;

  const deletePeriodMut = useDeleteSchoolYearPeriod();

  const openCreateModal = () => {
    setEditingPeriod(null);
    setModalOpen(true);
  };

  const openEditModal = (period: SchoolYearPeriod) => {
    setEditingPeriod(period);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPeriod(null);
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
    refetchPeriods();
  };

  const requestDelete = (period: SchoolYearPeriod) => {
    setDeleteTarget(period);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deletePeriodMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.schoolYearPeriodDeletedSuccessfully') });
      refetchPeriods();
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
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateWithMonthDay = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      
        <PageHeader
          titleKey="pages.schoolYearPeriodsTitle"
          descriptionKey="pages.schoolYearPeriodsDescription"
          icon={<CalendarDays className="w-5 h-5" />}
          actions={
            selectedSchoolYearId ? (
              <Button
                type="button"
                variant="primary"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('sections.addPeriod')}
              </Button>
            ) : undefined
          }
        />
        {selectedSchoolYearId && selectedSchoolYear && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <span className="font-medium">{t('sections.schoolYearLabel')}</span> {selectedSchoolYear.title}
              {selectedSchoolYear.start_date && selectedSchoolYear.end_date && (
                <span className="text-xs text-blue-700 ml-2">
                  ({formatDateWithMonthDay(selectedSchoolYear.start_date)} - {formatDateWithMonthDay(selectedSchoolYear.end_date)})
                </span>
              )}
            </p>
          </div>
        )}
        {!selectedSchoolYearId && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-900">
              <strong>{t('sections.noSchoolYearSelected')}</strong> {t('sections.selectSchoolYearToViewPeriods')}
            </p>
          </div>
        )}
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
        {hasNoOngoingPeriods && selectedSchoolYear && (
          <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">{t('sections.noOngoingPeriodWarning', { title: selectedSchoolYear.title })}</p>
                <p>{t('sections.recommendOneOngoingPeriod')}</p>
              </div>
            </div>
          </div>
        )}
      

      {selectedSchoolYearId && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SearchSelect
                label={t('sections.status')}
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
                <label className="block text-sm font-medium text-gray-700">{t('sections.search')}</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder={t('sections.searchByPeriodOrYear')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

          <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
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
                  {t('sections.schoolYear')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.lifecycleStatus')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.loadingPeriods')}
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.noPeriodsFound')}
                  </td>
                </tr>
              ) : (
                periods.map((period) => {
                  const schoolYearTitle = period.schoolYear?.title || 'N/A';
                  const lifecycleStatus = period.lifecycle_status || 'planned';
                  const rowBgClass = lifecycleRowBgStyles[lifecycleStatus] || 'bg-white hover:bg-gray-50';
                  return (
                    <tr key={period.id} className={rowBgClass}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{period.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(period.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(period.end_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {schoolYearTitle !== 'N/A' ? schoolYearTitle : <span className="text-xs text-gray-400">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                          {period.lifecycle_status === 'ongoing' ? t('sections.ongoing') : 
                           period.lifecycle_status === 'planned' ? t('sections.planned') : 
                           period.lifecycle_status === 'completed' ? t('sections.completed') : 
                           period.lifecycle_status || t('sections.planned')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton onClick={() => openEditModal(period)} />
                          <DeleteButton onClick={() => requestDelete(period)} />
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
          totalPages={meta.totalPages ?? 1}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
          hasNext={meta.hasNext ?? (meta.page < (meta.totalPages ?? 1))}
          hasPrevious={meta.hasPrevious ?? meta.page > 1}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
          </div>
        </>
      )}

      {selectedSchoolYearId && (
        <SchoolYearPeriodModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        period={
          editingPeriod
            ? ({
                ...editingPeriod,
                schoolYear: editingPeriod.schoolYear
                  ? {
                      id: editingPeriod.schoolYear.id,
                      title: editingPeriod.schoolYear.title,
                      start_date: (editingPeriod.schoolYear as { start_date?: string })?.start_date,
                      end_date: (editingPeriod.schoolYear as { end_date?: string })?.end_date,
                    }
                  : undefined,
              } as import('../forms/SchoolYearPeriodForm').SchoolYearPeriod)
            : undefined
        }
          initialSchoolYearId={selectedSchoolYearId ?? undefined}
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deletePeriod')}
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePeriodMut.isPending}
      />
    </div>
  );
};

export default SchoolYearPeriodsSection;
