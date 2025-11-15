import React, { useState } from 'react';
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

const statusFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const statusStyles: Record<PlanningSessionTypeStatus, string> = {
  active: 'bg-green-100 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border border-gray-200',
};

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const PlanningSessionTypesSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState<'all' | PlanningSessionTypeStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PlanningSessionType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlanningSessionType | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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
        setAlert({ type: 'success', message: 'Planning session type updated successfully.' });
      } else {
        await createMut.mutateAsync({
          ...values,
          coefficient: values.coefficient ?? undefined,
          // company_id is automatically set by the API from authenticated user
        });
        setAlert({ type: 'success', message: 'Planning session type created successfully.' });
      }
      refetch();
    } catch (err: any) {
      const message = extractErrorMessage(err);
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
      setAlert({ type: 'success', message: 'Planning session type deleted successfully.' });
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      const message = extractErrorMessage(err);
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
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Planning Session Types</h1>
            <p className="text-sm text-gray-500">
              Manage reusable session templates for planning, including type codes, coefficients, and availability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SearchSelect
              label="Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={statusFilterOptions}
              isClearable={false}
              className="w-44"
            />
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Type
            </button>
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
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Coefficient
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading planning session types…
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No planning session types found.
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
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {type.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {type.coefficient === null || type.coefficient === undefined ? '—' : Number(type.coefficient).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[type.status]}`}>
                        {type.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(type)}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(type)}
                          className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
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
        title="Delete Planning Session Type"
        entityName={deleteTarget?.title}
      />
    </div>
  );
};

export default PlanningSessionTypesSection;


