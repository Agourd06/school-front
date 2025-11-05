import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import useSchoolYearPeriods, { useUpdateSchoolYearPeriod } from '../../hooks/useSchoolYearPeriods';
import type { FilterParams, ListState } from '../../types/api';
import { STATUS_OPTIONS } from '../../constants/status';
import StatusBadge from '../../components/StatusBadge';
import { SchoolYearPeriodModal, DeleteModal } from '../../components/modals';

const SchoolYearPeriodsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'period' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: FilterParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined, status: (state.filters as any).status };
  const { data: response, isLoading, error } = useSchoolYearPeriods(params);
  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as any)?.message || null,
        pagination: {
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: (response.meta as any).totalPages ?? (response.meta as any).lastPage ?? 0,
          hasNext: (response.meta as any).hasNext ?? (response.meta.page < ((response.meta as any).totalPages ?? (response.meta as any).lastPage ?? 1)),
          hasPrevious: (response.meta as any).hasPrevious ?? (response.meta.page > 1),
        },
      }));
    }
  }, [response, isLoading, error]);

  const updater = useUpdateSchoolYearPeriod();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, status: -2 });
  };

  const requestDelete = (id: number) => {
    const period = state.data.find((item: any) => item.id === id);
    if (!period) return;
    setDeleteTarget({ id, name: period.title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await performDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const open = (data?: any) => setModal({ type: 'period', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return { ...prev, filters: { ...prev.filters, search: q }, pagination: { ...prev.pagination, page: 1 } };
    });
  }, []);

  return (
    <>
      <DataTableGeneric
        title="School Year Periods"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Period"
        searchPlaceholder="Search by period or year title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(period: any, onEdit, onDelete, index) => (
          <li key={period?.id ?? `period-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{period.title}</p>
                <p className="text-sm text-gray-500">{period.start_date} → {period.end_date}</p>
                <p className="text-sm text-gray-500">School Year: {period.schoolYear?.title || period.schoolYearTitle || 'N/A'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={period.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(period)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(period.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'period' && (
        <SchoolYearPeriodModal isOpen onClose={close} period={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Period"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default SchoolYearPeriodsSection;