import React, { useEffect, useMemo, useState } from 'react';
import {
  useAdministrators,
  useDeleteAdministrator,
} from '../../hooks/useAdministrators';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import AdministratorModal from '../modals/AdministratorModal';
import DeleteModal from '../modals/DeleteModal';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton, Button } from '../ui';
import type { Administrator } from '../../api/administrators';
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

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const AdministratorsSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdministrator, setEditingAdministrator] = useState<Administrator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Administrator | null>(null);
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
    data: administratorsResp,
    isLoading,
    error,
    refetch: refetchAdministrators,
  } = useAdministrators(params);

  const administrators = administratorsResp?.data ?? [];
  const meta = administratorsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteAdministratorMut = useDeleteAdministrator();

  const openCreateModal = () => {
    setEditingAdministrator(null);
    setModalOpen(true);
  };

  const openEditModal = (administrator: Administrator) => {
    setEditingAdministrator(administrator);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAdministrator(null);
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
    refetchAdministrators();
  };

  const requestDelete = (administrator: Administrator) => {
    setDeleteTarget(administrator);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteAdministratorMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Administrator deleted successfully.' });
      refetchAdministrators();
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

  const getAdministratorName = (administrator: Administrator) => {
    return `${administrator.first_name ?? ''} ${administrator.last_name ?? ''}`.trim() || administrator.email || `Administrator #${administrator.id}`;
  };

  const getClassRoomLabel = (administrator: Administrator) => {
    const classRoom = administrator.classRoom ;
    if (classRoom) {
      const title = classRoom.title || '';
      const code = classRoom.code || '';
      if (title && code) return `${title} (${code})`;
      return title || code || 'N/A';
    }
    return administrator.class_room_id ? `ID: ${administrator.class_room_id}` : 'N/A';
  };

  const getCompanyLabel = (administrator: Administrator) => {
    return administrator.company?.name || (administrator.company_id ? `ID: ${administrator.company_id}` : 'N/A');
  };

  const getPictureUrl = (picture?: string) => {
    if (!picture) return null;
    return getFileUrl(picture);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Administrators</h1>
            <p className="text-sm text-gray-500">Manage administrators and their information.</p>
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
              Add Administrator
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
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
                  Administrator
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Class & Company
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
                    Loading administrators…
                  </td>
                </tr>
              ) : administrators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                administrators.map((administrator) => {
                  const pictureUrl = getPictureUrl(administrator.picture);
                  return (
                    <tr key={administrator.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {pictureUrl && (
                            <img
                              src={pictureUrl}
                              alt="avatar"
                              className="h-10 w-10 rounded-full object-cover border"
                            />
                          )}
                          <div>
                            <div>{administrator.first_name} {administrator.last_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>{administrator.email}</div>
                          {administrator.phone && <div className="text-xs text-gray-500">{administrator.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>Class: {getClassRoomLabel(administrator)}</div>
                          <div className="text-xs text-gray-500">Company: {getCompanyLabel(administrator)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <StatusBadge value={administrator.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton onClick={() => openEditModal(administrator)} />
                          <DeleteButton onClick={() => requestDelete(administrator)} />
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

      <AdministratorModal isOpen={modalOpen} onClose={handleModalClose} administrator={editingAdministrator ?? undefined} />

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Administrator"
        entityName={deleteTarget ? getAdministratorName(deleteTarget) : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAdministratorMut.isPending}
      />
    </div>
  );
};

export default AdministratorsSection;
