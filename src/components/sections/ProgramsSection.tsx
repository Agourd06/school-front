import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { usePrograms, useDeleteProgram } from '../../hooks/usePrograms';
import { ProgramModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';

const ProgramsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'program' | null; data?: any }>({ type: null });

  const params: FilterParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status,
  };
  const { data: response, isLoading, error } = usePrograms(params);

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

  const del = useDeleteProgram();
  const handleDelete = async (id: number) => {
    if (window.confirm('Delete program?')) await del.mutateAsync(id);
  };

  const open = (data?: any) => setModal({ type: 'program', data });
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

  return (
    <>
      <DataTableGeneric
        title="Programs"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Program"
        searchPlaceholder="Search by program title..."
        renderRow={(program: any, onEdit, onDelete, index) => (
          <li key={program?.id ?? `program-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{program.title}</p>
                <p className="text-sm text-gray-500">{program.description || 'No description'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={program.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(program)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(program.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'program' && (
        <ProgramModal isOpen onClose={close} program={modal.data} />
      )}
    </>
  );
};

export default ProgramsSection;


