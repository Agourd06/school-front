import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import useSchoolYearPeriods, { useDeleteSchoolYearPeriod } from '../../hooks/useSchoolYearPeriods';
import type { FilterParams, ListState } from '../../types/api';
import { SchoolYearPeriodModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';

const SchoolYearPeriodsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'period' | null; data?: any }>({ type: null });

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

  const del = useDeleteSchoolYearPeriod();
  const handleDelete = async (id: number) => { if (window.confirm('Delete period?')) await del.mutateAsync(id); };

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
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Period"
        searchPlaceholder="Search by period or year title..."
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
    </>
  );
};

export default SchoolYearPeriodsSection;
