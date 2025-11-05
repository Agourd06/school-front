import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { ListState } from '../../types/api';
import type { GetAllStudentLinkTypeParams } from '../../api/studentLinkType';
import { useStudentLinkTypes, useUpdateStudentLinkType } from '../../hooks/useStudentLinkTypes';
import { StudentLinkTypeModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const StudentLinkTypesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'slt' | null; data?: any }>({ type: null });

  const params: GetAllStudentLinkTypeParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useStudentLinkTypes(params);

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

  const updater = useUpdateStudentLinkType();
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete type?')) return;
    await updater.mutateAsync({ id, data: { status: -2 } });
  };

  const open = (data?: any) => setModal({ type: 'slt', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, search: q }, pagination: { ...prev.pagination, page: 1 } }));
  }, []);

  return (
    <>
      <DataTableGeneric
        title="Student Link Types"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Link Type"
        searchPlaceholder="Search by title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(t: any, onEdit, onDelete) => (
          <li key={t.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>Status:</span>
                  <StatusBadge value={t.status} />
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(t)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(t.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'slt' && (
        <StudentLinkTypeModal isOpen onClose={close} item={modal.data} />
      )}
    </>
  );
};

export default StudentLinkTypesSection;


