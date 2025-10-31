import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useUsers, useDeleteUser } from '../../hooks/useUsers';
import type { ListState, SearchParams } from '../../types/api';
import { UserModal } from '../../components/modals';

const UsersSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '' },
  });
  const [modal, setModal] = React.useState<{ type: 'user' | null; data?: any }>({ type: null });

  const params: SearchParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
  };
  const { data: response, isLoading, error } = useUsers(params);
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

  const del = useDeleteUser();
  const handleDelete = async (id: number) => {
    if (window.confirm('Delete user?')) await del.mutateAsync(id);
  };

  const openModal = (data?: any) => setModal({ type: 'user', data });
  const closeModal = () => setModal({ type: null });

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
        title="Users"
        state={state}
        onAdd={() => openModal(null)}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        addButtonText="Add User"
        searchPlaceholder="Search by email or username..."
        renderRow={(user: any, onEdit, onDelete) => (
          <li key={user.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Role: {user.role}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'user' && (
        <UserModal isOpen onClose={closeModal} user={modal.data} />
      )}
    </>
  );
};

export default UsersSection;
