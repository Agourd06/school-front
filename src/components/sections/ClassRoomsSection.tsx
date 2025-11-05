import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useClassRooms, useUpdateClassRoom } from '../../hooks/useClassRooms';
import type { ListState } from '../../types/api';
import type { GetAllClassRoomsParams } from '../../api/classRoom';
import { ClassRoomModal, DeleteModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const ClassRoomsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'classRoom' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: GetAllClassRoomsParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useClassRooms(params);
  React.useEffect(() => { if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta })); }, [response, isLoading, error]);

  const updater = useUpdateClassRoom();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, status: -2 });
  };

  const requestDelete = (id: number) => {
    const classRoom = state.data.find((item: any) => item.id === id);
    if (!classRoom) return;
    const label = [classRoom.code, classRoom.title].filter(Boolean).join(' — ');
    setDeleteTarget({ id, name: label || undefined });
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
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Class Room"
        searchPlaceholder="Search by code or title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(cr: any, onEdit, onDelete) => (
          <li key={cr.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cr.code} — {cr.title}</p>
                <p className="text-sm text-gray-500">Capacity: {cr.capacity}</p>
                <p className="text-sm text-gray-500">Company ID: {cr.company_id ?? 'N/A'}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>Status:</span>
                  <StatusBadge value={cr.status} />
                </div>
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

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Classroom"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default ClassRoomsSection;
