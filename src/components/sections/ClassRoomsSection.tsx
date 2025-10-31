import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useClassRooms, useDeleteClassRoom } from '../../hooks/useClassRooms';
import type { ListState, SearchParams } from '../../types/api';
import { ClassRoomModal } from '../../components/modals';

const ClassRoomsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '' },
  });
  const [modal, setModal] = React.useState<{ type: 'classRoom' | null; data?: any }>({ type: null });

  const params: SearchParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined };
  const { data: response, isLoading, error } = useClassRooms(params as any);
  React.useEffect(() => { if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta })); }, [response, isLoading, error]);

  const del = useDeleteClassRoom();
  const handleDelete = async (id: number) => { if (window.confirm('Delete class room?')) await del.mutateAsync(id); };

  const open = (data?: any) => setModal({ type: 'classRoom', data });
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
        title="Class Rooms"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        addButtonText="Add Class Room"
        searchPlaceholder="Search by code or title..."
        renderRow={(cr: any, onEdit, onDelete) => (
          <li key={cr.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cr.code} — {cr.title}</p>
                <p className="text-sm text-gray-500">Capacity: {cr.capacity}</p>
                <p className="text-sm text-gray-500">Company ID: {cr.company_id ?? 'N/A'}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(cr)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(cr.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'classRoom' && (
        <ClassRoomModal isOpen onClose={close} classRoom={modal.data} />
      )}
    </>
  );
};

export default ClassRoomsSection;
