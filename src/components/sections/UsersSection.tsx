import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useUsers, useUpdateUser } from '../../hooks/useUsers';
import type { FilterParams, ListState } from '../../types/api';
import { UserModal, DeleteModal } from '../../components/modals';
import { STATUS_OPTIONS } from '../../constants/status';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton } from '../ui';
import type { User } from '../../api/users';

const UsersSection: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = React.useState<ListState<User>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'user' | null; data?: User | null }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: FilterParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: state.filters.status,
  };
  const { data: response, isLoading, error } = useUsers(params);

  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as { message?: string })?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

  const updater = useUpdateUser();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, status: -2 });
  };

  const requestDelete = (id: number) => {
    const user = state.data.find((item) => item.id === id);
    if (!user) return;
    setDeleteTarget({ id, name: user.username || user.email || undefined });
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

  const openModal = (data?: User | null) => setModal({ type: 'user', data: data ?? null });
  const closeModal = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = prev.filters.search ?? '';
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
        title={t('sidebar.users')}
        state={state}
        onAdd={() => openModal(null)}
        onEdit={(item) => openModal(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({
          ...prev,
          filters: { ...prev.filters, status },
          pagination: { ...prev.pagination, page: 1 },
        }))}
        addButtonText={t('sections.addUser')}
        searchPlaceholder={t('sections.searchByNameOrEmail')}
        filterOptions={STATUS_OPTIONS}
        renderRow={(user: User, onEdit, onDelete, index) => {
          const profileLabelKey = `profile.${user.profile}`;
          return (
            <li key={user.id ?? index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{t('forms.profileLabel')}</span>
                      <span className="font-medium text-gray-700 capitalize">{t(profileLabelKey)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{t('forms.statusLabel')}</span>
                      <StatusBadge value={user.status} />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <EditButton onClick={() => onEdit(user)} />
                  <DeleteButton onClick={() => onDelete(user.id)} />
                </div>
              </div>
            </li>
          );
        }}
      />

      {modal.type === 'user' && (
        <UserModal isOpen onClose={closeModal} user={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('forms.deleteUser')}
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default UsersSection;
