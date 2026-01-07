import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useStudentLinkTypes,
  useDeleteStudentLinkType,
} from '../../hooks/useStudentLinkTypes';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import { StudentLinkTypeModal } from '../modals';
import DeleteModal from '../modals/DeleteModal';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton, Input, Button } from '../ui';
import type { StudentLinkType } from '../../api/studentLinkType';
import { STATUS_OPTIONS } from '../../constants/status';

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

const StudentLinkTypesSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLinkType, setEditingLinkType] = useState<StudentLinkType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentLinkType | null>(null);
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
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: linkTypesResp,
    isLoading,
    error,
    refetch: refetchLinkTypes,
  } = useStudentLinkTypes(params);

  const linkTypes = linkTypesResp?.data ?? [];
  const meta = linkTypesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteLinkTypeMut = useDeleteStudentLinkType();

  const openCreateModal = () => {
    setEditingLinkType(null);
    setModalOpen(true);
  };

  const openEditModal = (linkType: StudentLinkType) => {
    setEditingLinkType(linkType);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLinkType(null);
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
    refetchLinkTypes();
  };

  const requestDelete = (linkType: StudentLinkType) => {
    setDeleteTarget(linkType);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteLinkTypeMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Link type deleted successfully.' });
      refetchLinkTypes();
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

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('sidebar.studentLinkTypes')}</h1>
            <p className="text-sm text-gray-500">{t('sections.manageStudentLinkTypes')}</p>
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
              {t('sections.addStudentLinkType')}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <div className="md:col-span-2">
            <Input
              label="Search"
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by title..."
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
                  Title
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
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading link types…
                  </td>
                </tr>
              ) : linkTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-500">
                    No link types found.
                  </td>
                </tr>
              ) : (
                linkTypes.map((linkType) => (
                  <tr key={linkType.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{linkType.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <StatusBadge value={linkType.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <EditButton onClick={() => openEditModal(linkType)} />
                        <DeleteButton onClick={() => requestDelete(linkType)} />
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

      <StudentLinkTypeModal isOpen={modalOpen} onClose={handleModalClose} item={editingLinkType ? { ...editingLinkType, status: editingLinkType.status ?? 1 } : undefined} />

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Link Type"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLinkTypeMut.isPending}
      />
    </div>
  );
};

export default StudentLinkTypesSection;
