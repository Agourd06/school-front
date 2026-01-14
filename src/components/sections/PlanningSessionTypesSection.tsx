import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  PlanningSessionType,
  PlanningSessionTypeStatus,
} from '../../api/planningSessionType';
import {
  usePlanningSessionTypes,
  useCreatePlanningSessionType,
  useUpdatePlanningSessionType,
  useDeletePlanningSessionType,
} from '../../hooks/usePlanningSessionTypes';
import PlanningSessionTypeModal, {
  type PlanningSessionTypeFormValues,
} from '../modals/PlanningSessionTypeModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Button, PageHeader } from '../ui';
import { Clock } from 'lucide-react';
import Pagination from '../Pagination';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';

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
  { value: 'active', label: t('forms.active') },
  { value: 'inactive', label: t('forms.inactive') },
];

const statusStyles: Record<PlanningSessionTypeStatus, string> = {
  active: 'bg-green-100 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border border-gray-200',
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

const PlanningSessionTypesSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState<'all' | PlanningSessionTypeStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PlanningSessionType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlanningSessionType | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  const statusFilterOptions = getStatusFilterOptions(t);

  const { data, isLoading, error, refetch } = usePlanningSessionTypes({
    page: pagination.page,
    limit: pagination.limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const types = data?.data ?? [];
  const meta = data?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createMut = useCreatePlanningSessionType();
  const updateMut = useUpdatePlanningSessionType();
  const deleteMut = useDeletePlanningSessionType();

  const handleOpenCreate = () => {
    setSelectedType(null);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type: PlanningSessionType) => {
    setSelectedType(type);
    setModalError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedType(null);
    setModalError(null);
  };

  const handleSubmit = async (values: PlanningSessionTypeFormValues) => {
    setAlert(null);
    setModalError(null);
    try {
      if (selectedType) {
        await updateMut.mutateAsync({
          id: selectedType.id,
          data: {
            ...values,
            coefficient: values.coefficient ?? undefined,
            // company_id is automatically set by the API from authenticated user
          },
        });
        setAlert({ type: 'success', message: t('messages.planningSessionTypeUpdatedSuccessfully') });
      } else {
        await createMut.mutateAsync({
          ...values,
          coefficient: values.coefficient ?? undefined,
          // company_id is automatically set by the API from authenticated user
        });
        setAlert({ type: 'success', message: t('messages.planningSessionTypeCreatedSuccessfully') });
      }
      refetch();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
      setModalError(message);
      setAlert({ type: 'error', message });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setAlert({ type: 'success', message: t('messages.planningSessionTypeDeletedSuccessfully') });
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
      setAlert({ type: 'error', message });
    }
  };

  const handleStatusFilterChange = (value: string | number | '') => {
    setStatusFilter((value || 'all') as 'all' | PlanningSessionTypeStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({ page: 1, limit: size });
  };

  return (
    <div className="space-y-6">
      
        <PageHeader
          titleKey="pages.planningSessionTypesTitle"
          descriptionKey="pages.planningSessionTypesDescription"
          icon={<Clock className="w-5 h-5" />}
          actions={
            <>
            <SearchSelect
              label={t('common.status')}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={statusFilterOptions}
              isClearable={false}
              className="w-44"
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('sections.addPlanningSessionType')}
            </Button>
            </>
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
      

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings.title')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings.type')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings.coefficient')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.status')}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('settings.loadingPlanningSessionTypes')}
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('settings.noPlanningSessionTypesFound')}
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{type.title}</span>
                        <span className="text-xs text-gray-500">#{type.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                        {type.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {type.coefficient === null || type.coefficient === undefined ? '—' : Number(type.coefficient).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[type.status]}`}>
                        {type.status === 'active' ? t('forms.active') : t('forms.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <EditButton onClick={() => handleOpenEdit(type)} />
                        <DeleteButton onClick={() => setDeleteTarget(type)} />
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
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      </div>

      <PlanningSessionTypeModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        initialData={selectedType ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createMut.isPending || updateMut.isPending}
        serverError={modalError}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMut.isPending}
        title={t('settings.deletePlanningSessionType')}
        entityName={deleteTarget?.title}
      />
    </div>
  );
};

export default PlanningSessionTypesSection;


