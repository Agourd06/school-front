import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useSpecializations, useUpdateSpecialization } from '../../hooks/useSpecializations';
import { usePrograms } from '../../hooks/usePrograms';
import { SpecializationModal, DeleteModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const SpecializationsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'specialization' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);
  const [programFilter, setProgramFilter] = React.useState<number | ''>('');

  const params: FilterParams & { program_id?: number } = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status,
    program_id: programFilter ? Number(programFilter) : undefined,
  };
  const { data: response, isLoading, error } = useSpecializations(params as any);
  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = ((programsResp as any)?.data || []) as any[];

  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as any)?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

  const updater = useUpdateSpecialization();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, data: { status: -2 } });
  };

  const requestDelete = (id: number) => {
    const specialization = state.data.find((item: any) => item.id === id);
    if (!specialization) return;
    setDeleteTarget({ id, name: specialization.title });
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

  const open = (data?: any) => setModal({ type: 'specialization', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return {
        ...prev,
        filters: { ...prev.filters, search: q },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const handleProgramFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setProgramFilter(numeric);
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-gray-700">Filter by Program</label>
          <select
            value={programFilter}
            onChange={(e) => handleProgramFilter(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTableGeneric
        title="Specializations"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Specialization"
        searchPlaceholder="Search by specialization title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(spec: any, onEdit, onDelete, index) => {
          const programTitle = spec.program?.title
            || programs.find(p => Number(p.id) === Number(spec.program_id))?.title
            || '—';

          return (
          <li key={spec?.id ?? `specialization-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{spec.title}</p>
                <p className="text-sm text-gray-500">Program: {programTitle}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={spec.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(spec)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(spec.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
          );
        }}
      />

      {modal.type === 'specialization' && (
        <SpecializationModal isOpen onClose={close} specialization={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Specialization"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default SpecializationsSection;


