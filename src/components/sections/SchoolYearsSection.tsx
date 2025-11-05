import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useSchoolYears, useUpdateSchoolYear } from '../../hooks/useSchoolYears';
import type { GetAllSchoolYearsParams } from '../../api/schoolYear';
import type { ListState } from '../../types/api';
import SchoolYearModal from '../../components/modals/SchoolYearModal';
import { DeleteModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const SchoolYearsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'schoolYear' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: GetAllSchoolYearsParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined, status: (state.filters as any).status === null ? undefined : (state.filters as any).status } as any;
  const { data: response, isLoading, error } = useSchoolYears(params);
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
          hasNext: (response.meta as any).hasNext ?? false,
          hasPrevious: (response.meta as any).hasPrevious ?? false,
        },
      }));
    }
  }, [response, isLoading, error]);

  const updater = useUpdateSchoolYear();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, status: -2 });
  };

  const requestDelete = (id: number) => {
    const schoolYear = state.data.find((item: any) => item.id === id);
    if (!schoolYear) return;
    setDeleteTarget({ id, name: schoolYear.title });
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

  const open = (data?: any) => setModal({ type: 'schoolYear', data });
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
        title="School Years"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add School Year"
        searchPlaceholder="Search by school year title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(schoolYear: any, onEdit, onDelete, index) => (
          <li key={schoolYear?.id ?? `schoolYear-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{schoolYear.title}</p>
                <p className="text-sm text-gray-500">{schoolYear.start_date} → {schoolYear.end_date}</p>
                <p className="text-sm text-gray-500">Company: {schoolYear.company?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={schoolYear.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(schoolYear)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(schoolYear.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'schoolYear' && (
        <SchoolYearModal isOpen onClose={close} schoolYear={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete School Year"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default SchoolYearsSection;
