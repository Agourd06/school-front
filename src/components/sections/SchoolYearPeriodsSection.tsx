import React, { useEffect, useMemo, useState } from 'react';
import {
  useSchoolYearPeriods,
 
  useDeleteSchoolYearPeriod,
} from '../../hooks/useSchoolYearPeriods';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import SchoolYearPeriodModal from '../modals/SchoolYearPeriodModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton } from '../ui';
import type { SchoolYearPeriod } from '../../api/schoolYearPeriod';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
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

const statusFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const lifecycleStatusFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All lifecycle statuses' },
  { value: 'planned', label: 'Planned' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

const lifecycleStatusStyles: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

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

const SchoolYearPeriodsSection: React.FC = () => {
  const { selectedSchoolYearId } = useSchoolYear();
  const { data: selectedSchoolYear } = useSchoolYearById(selectedSchoolYearId || 0);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    lifecycle_status: 'all',
    search: '',
  });

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

  const periods = periodsResp?.data ?? [];
  const meta = periodsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

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
      setAlert({ type: 'success', message: 'School year period deleted successfully.' });
      refetchPeriods();
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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">School Year Periods</h1>
            <p className="text-sm text-gray-500">Manage school year periods and their date ranges.</p>
            {selectedSchoolYearId && selectedSchoolYear && (
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  School Year: <span className="font-medium text-gray-900">{selectedSchoolYear.title}</span>
                  {selectedSchoolYear.start_date && selectedSchoolYear.end_date && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatDateWithMonthDay(selectedSchoolYear.start_date)} - {formatDateWithMonthDay(selectedSchoolYear.end_date)})
                    </span>
                  )}
                </span>
              </div>
            )}
            {!selectedSchoolYearId && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>No school year selected.</strong> Please select a school year from the School Years section to view and manage its periods.
                </p>
              </div>
            )}
          </div>
          {selectedSchoolYearId && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Period
              </button>
            </div>
          )}
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
      

      {selectedSchoolYearId && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SearchSelect
                label="Status"
                value={filters.status}
                onChange={handleFilterChange('status')}
                options={statusFilterOptions}
                isClearable={false}
              />
              <SearchSelect
                label="Lifecycle Status"
                value={filters.lifecycle_status}
                onChange={handleFilterChange('lifecycle_status')}
                options={lifecycleStatusFilterOptions}
                isClearable={false}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search by period or year title..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  School Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lifecycle Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading periods…
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No periods found.
                  </td>
                </tr>
              ) : (
                periods.map((period) => {
                  const statusValue = typeof period.status === 'number' ? period.status : 0;
                  const schoolYearTitle = period.schoolYear?.title || 'N/A';
                  return (
                    <tr key={period.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{period.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(period.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(period.end_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {schoolYearTitle !== 'N/A' ? schoolYearTitle : <span className="text-xs text-gray-400">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[statusValue] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[statusValue] ?? `Status ${statusValue}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            lifecycleStatusStyles[period.lifecycle_status || 'planned'] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {period.lifecycle_status || 'planned'}
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
        period={editingPeriod ?? undefined}
          initialSchoolYearId={selectedSchoolYearId ?? undefined}
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Period"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePeriodMut.isPending}
      />
    </div>
  );
};

export default SchoolYearPeriodsSection;
