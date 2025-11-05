import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { usePrograms, useUpdateProgram } from '../../hooks/usePrograms';
import { ProgramModal, DeleteModal, DescriptionModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const ProgramsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'program' | 'description' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

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

  const updater = useUpdateProgram();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, data: { status: -2 } });
  };

  const requestDelete = (id: number) => {
    const program = state.data.find((item: any) => item.id === id);
    if (!program) return;
    setDeleteTarget({ id, name: program.title });
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

  const open = (data?: any) => setModal({ type: 'program', data });
  const openDescription = (data?: any) => setModal({ type: 'description', data });
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

  const stripHtml = (input?: string) => {
    if (!input) return '';
    return input.replace(/<[^>]+>/g, '');
  };

  const getDescriptionPreview = (input?: string) => {
    const text = stripHtml(input);
    if (!text) return '';
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  };

  return (
    <>
      <DataTableGeneric
        title="Programs"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Program"
        searchPlaceholder="Search by program title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(program: any, onEdit, onDelete, index) => (
          <li key={program?.id ?? ('program-' + index)} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{program.title}</p>
                <p className="text-sm text-gray-500">
                  {getDescriptionPreview(program.description) || 'No description'}
                </p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={program.status} /></p>
              </div>
              <div className="flex space-x-2">
                {program.description && (
                  <button onClick={() => openDescription(program)} className="text-green-600 hover:text-green-900">Details</button>
                )}
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
      {modal.type === 'description' && (
        <DescriptionModal
          isOpen
          onClose={close}
          title={modal.data?.title}
          description={modal.data?.description}
          type="program"
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Program"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default ProgramsSection;