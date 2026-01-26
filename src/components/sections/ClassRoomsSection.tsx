import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useClassRooms,
  useDeleteClassRoom,
} from '../../hooks/useClassRooms';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import ClassRoomModal from '../modals/ClassRoomModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Button, Input, PageHeader } from '../ui';
import { Building2 } from 'lucide-react';
import type { ClassRoom } from '../../api/classRoom';
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
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
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

const ClassRoomsSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassRoom, setEditingClassRoom] = useState<ClassRoom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRoom | null>(null);
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
    data: classRoomsResp,
    isLoading,
    error,
    refetch: refetchClassRooms,
  } = useClassRooms(params);

  const classRooms = classRoomsResp?.data ?? [];
  const meta = classRoomsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteClassRoomMut = useDeleteClassRoom();

  const openCreateModal = () => {
    setEditingClassRoom(null);
    setModalOpen(true);
  };

  const openEditModal = (classRoom: ClassRoom) => {
    setEditingClassRoom(classRoom);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClassRoom(null);
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
    refetchClassRooms();
  };

  const requestDelete = (classRoom: ClassRoom) => {
    setDeleteTarget(classRoom);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteClassRoomMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.classroomDeletedSuccessfully') });
      refetchClassRooms();
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
        <PageHeader
          titleKey="pages.classRoomsTitle"
          descriptionKey="pages.classRoomsDescription"
          icon={<Building2 className="w-5 h-5" />}
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
              {t('sections.addClassRoom')}
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
          <div className="mt-4 rounded-md border border-danger-light bg-danger-light px-4 py-2 text-sm text-danger-dark">
            {(error as Error).message}
          </div>
        )}
      

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('common.search')}
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchByCodeOrTitle')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
        </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sections.code')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sections.title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sections.capacity')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('forms.type')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    {t('sections.loadingClassrooms')}
                  </td>
                </tr>
              ) : classRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    {t('sections.noClassroomsFound')}
                  </td>
                </tr>
              ) : (
                classRooms.map((classRoom) => {
                  const statusValue = typeof classRoom.status === 'number' ? classRoom.status : 0;
                  const classroomTypeTitle = classRoom.classroomType?.title || '—';
                  return (
                    <tr key={classRoom.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{classRoom.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{classRoom.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="font-semibold text-heading">{classRoom.capacity}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {classroomTypeTitle}
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
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton onClick={() => openEditModal(classRoom)} />
                          <DeleteButton onClick={() => requestDelete(classRoom)} />
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

      <ClassRoomModal isOpen={modalOpen} onClose={handleModalClose} classRoom={editingClassRoom ?? undefined} />

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deleteClassroom')}
        entityName={deleteTarget ? `${deleteTarget.code} — ${deleteTarget.title}` : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteClassRoomMut.isPending}
      />
    </div>
  );
};

export default ClassRoomsSection;
