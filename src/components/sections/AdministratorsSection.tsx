import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useAdministrators, useDeleteAdministrator } from '../../hooks/useAdministrators';
import type { ListState } from '../../types/api';
import type { GetAllAdministratorsParams } from '../../api/administrators';
import AdministratorModal from '../../components/modals/AdministratorModal';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const AdministratorsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'administrator' | null; data?: any }>({ type: null });

  const params: GetAllAdministratorsParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useAdministrators(params);
  React.useEffect(() => { if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta })); }, [response, isLoading, error]);

  const del = useDeleteAdministrator();
  const handleDelete = async (id: number) => { if (window.confirm('Delete administrator?')) await del.mutateAsync(id); };

  const open = (data?: any) => setModal({ type: 'administrator', data });
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
        title="Administrators"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Administrator"
        searchPlaceholder="Search by name or email..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(a: any, onEdit, onDelete) => (
           <li key={a.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  {a.picture && (
                    <img
                      src={(a.picture?.startsWith('http') ? a.picture : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${a.picture?.startsWith('/') ? '' : '/'}${a.picture || ''}`)}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.first_name} {a.last_name}</p>
                    <p className="text-sm text-gray-500">Email: {a.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const classRoom = a.classRoom || a.class_room;
                    const classLabel = classRoom ? `${classRoom.title || ''}${classRoom.code ? (classRoom.title ? ` (${classRoom.code})` : classRoom.code) : ''}`.trim() : (a.class_room_id ? `ID: ${a.class_room_id}` : 'N/A');
                    const companyLabel = a.company?.name || a.company_id || 'N/A';
                    return <>Class: {classLabel} • Company: {companyLabel}</>;
                  })()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <StatusBadge value={a.status} />
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(a)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(a.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'administrator' && (
        <AdministratorModal isOpen onClose={close} administrator={modal.data} />
      )}
    </>
  );
};

export default AdministratorsSection;
