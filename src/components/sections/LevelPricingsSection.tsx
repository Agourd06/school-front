import React, { useEffect, useMemo, useState } from 'react';
import {
  useLevelPricings,
  useCreateLevelPricing,
  useUpdateLevelPricing,
  useDeleteLevelPricing,
} from '../../hooks/useLevelPricings';
import { useLevels } from '../../hooks/useLevels';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import LevelPricingModal, { type LevelPricingFormValues } from '../modals/LevelPricingModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Button } from '../ui';
import type { LevelPricing, LevelPricingStatus } from '../../api/levelPricing';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';

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

const formatCurrency = (value: string | number | null | undefined) => {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

const LevelPricingsSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    level: '',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<LevelPricing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LevelPricing | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? (Number(filters.status) as LevelPricingStatus)
          : undefined,
      level_id: filters.level ? Number(filters.level) : undefined,
      // company_id is automatically filtered by backend from JWT
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: pricingResp,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: refetchPricings,
  } = useLevelPricings(params);

  const pricings = pricingResp?.data ?? [];
  const pricingMeta = pricingResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createPricingMut = useCreateLevelPricing();
  const updatePricingMut = useUpdateLevelPricing();
  const deletePricingMut = useDeleteLevelPricing();

  const { data: levelsResp } = useLevels({ page: 1, limit: 100 } as any);

  const levelOptions = useMemo<SearchSelectOption[]>(
    () =>
      (levelsResp?.data || []).map((level) => ({
        value: level.id,
        label: level.title || `Level #${level.id}`,
      })),
    [levelsResp]
  );


  const openCreateModal = () => {
    setEditingPricing(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (pricing: LevelPricing) => {
    setEditingPricing(pricing);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPricing(null);
    setModalError(null);
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

  const handleSubmit = async (values: LevelPricingFormValues) => {
    setModalError(null);
    setAlert(null);

    const occurrencesValue = values.occurrences.trim() === '' ? 1 : Number(values.occurrences);

    const payload = {
      level_id: Number(values.level_id),
      title: values.title.trim(),
      amount: Number(values.amount),
      occurrences: occurrencesValue,
      every_month: values.every_month ? 1 : 0,
      // company_id is automatically set by the API from authenticated user
      status: values.status,
    };

    try {
      if (editingPricing) {
        await updatePricingMut.mutateAsync({ id: editingPricing.id, data: payload });
        setAlert({ type: 'success', message: 'Level pricing updated successfully.' });
      } else {
        await createPricingMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Level pricing created successfully.' });
      }
      closeModal();
      refetchPricings();
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
      await deletePricingMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Level pricing deleted successfully.' });
      refetchPricings();
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

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Level Pricings</h1>
            <p className="text-sm text-gray-500">Manage pricing plans for each academic level.</p>
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
              Add Pricing
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
        {pricingError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(pricingError as Error).message}
          </div>
        )}
      

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label="Level"
            value={filters.level}
            onChange={handleFilterChange('level')}
            options={levelOptions}
            placeholder="All levels"
            isClearable
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by title"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Occurrences
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Monthly
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
              {pricingLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading level pricings…
                  </td>
                </tr>
              ) : pricings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    No level pricing records found.
                  </td>
                </tr>
              ) : (
                pricings.map((pricing) => (
                  <tr key={pricing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">#{pricing.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{pricing.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {pricing.level?.title || `Level #${pricing.level_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(pricing.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{pricing.occurrences ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pricing.every_month
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {pricing.every_month ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[pricing.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_VALUE_LABEL[pricing.status] ?? `Status ${pricing.status}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <EditButton onClick={() => openEditModal(pricing)} />
                        <DeleteButton onClick={() => setDeleteTarget(pricing)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pricingMeta.page}
          totalPages={pricingMeta.totalPages}
          totalItems={pricingMeta.total}
          itemsPerPage={pricingMeta.limit}
          hasNext={pricingMeta.hasNext}
          hasPrevious={pricingMeta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={pricingLoading}
        />
      </div>

      <LevelPricingModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialData={editingPricing ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createPricingMut.isPending || updatePricingMut.isPending}
        levelOptions={levelOptions}
        serverError={modalError}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePricingMut.isPending}
        title="Delete Level Pricing"
        entityName={deleteTarget?.title}
      />
    </div>
  );
};

export default LevelPricingsSection;

