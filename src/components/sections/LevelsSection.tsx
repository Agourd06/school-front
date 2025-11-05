import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useLevels, useDeleteLevel } from '../../hooks/useLevels';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { LevelModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const LevelsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'level' | null; data?: any }>({ type: null });
  const [programFilter, setProgramFilter] = React.useState<number | ''>('');
  const [specializationFilter, setSpecializationFilter] = React.useState<number | ''>('');

  const params: FilterParams & { specialization_id?: number } = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status,
    specialization_id: specializationFilter ? Number(specializationFilter) : undefined,
  };

  const { data: response, isLoading, error } = useLevels(params as any);
  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = ((programsResp as any)?.data || []) as any[];
  const { data: specializationResp } = useSpecializations({ page: 1, limit: 100, program_id: programFilter ? Number(programFilter) : undefined } as any);
  const specializations = ((specializationResp as any)?.data || []) as any[];

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

  const del = useDeleteLevel();
  const handleDelete = async (id: number) => {
    if (window.confirm('Delete level?')) await del.mutateAsync(id);
  };

  const open = (data?: any) => setModal({ type: 'level', data });
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
    setSpecializationFilter('');
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  const handleSpecializationFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setSpecializationFilter(numeric);
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  return (
    <>
  

      <DataTableGeneric
        title="Levels"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Level"
        searchPlaceholder="Search by level title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(lvl: any, onEdit, onDelete, index) => (
          <li key={lvl?.id ?? `level-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{lvl.title}</p>
                <p className="text-sm text-gray-500">Specialization: {lvl.specialization?.title || specializations.find(s => s.id === lvl.specialization_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Program: {lvl.specialization?.program?.title || programs.find(p => p.id === (lvl.specialization?.program?.id || lvl.specialization?.program_id))?.title || programs.find(p => p.id === programFilter)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Level: {lvl.level ?? '—'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={lvl.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(lvl)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(lvl.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'level' && (
        <LevelModal isOpen onClose={close} level={modal.data} />
      )}
    </>
  );
};

export default LevelsSection;


