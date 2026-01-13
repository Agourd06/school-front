import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTableGeneric from '../../components/DataTableGeneric';
import { 
  useUsers, 
  useUpdateUser, 
  useSendPasswordInvitationById,
  useCreateUser 
} from '../../hooks/useUsers';
import type { FilterParams, ListState } from '../../types/api';
import { UserModal, DeleteModal } from '../../components/modals';
import { STATUS_OPTIONS } from '../../constants/status';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton, Button } from '../ui';
import { ToastContainer, type ToastType } from '../ui/Toast';
import type { User } from '../../api/users';
import UserRolesModal from '../modals/UserRolesModal';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

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
  const [rolesModalUser, setRolesModalUser] = React.useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [wasCreatingUser, setWasCreatingUser] = React.useState(false);

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
  const createUser = useCreateUser();
  const sendInvitation = useSendPasswordInvitationById();

  // Show success message when user is created and modal closes
  React.useEffect(() => {
    if (wasCreatingUser && createUser.isSuccess && !modal.type) {
      handleUserCreated();
      setWasCreatingUser(false);
    }
  }, [createUser.isSuccess, modal.type, wasCreatingUser]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const extractErrorMessage = (err: unknown): string => {
    if (!err) return t('messages.unexpectedError') || 'An unexpected error occurred';
    const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
    const dataMessage = axiosError?.response?.data?.message;
    if (Array.isArray(dataMessage)) return dataMessage.join(', ');
    if (typeof dataMessage === 'string') return dataMessage;
    if (typeof axiosError.message === 'string') return axiosError.message;
    return t('messages.unexpectedError') || 'An unexpected error occurred';
  };

  const performDelete = async (id: number) => {
    try {
      await updater.mutateAsync({ id, status: -2 });
      addToast('success', t('messages.userDeletedSuccessfully') || 'User deleted successfully');
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    }
  };

  const handleResendInvitation = async (userId: number) => {
    try {
      await sendInvitation.mutateAsync(userId);
      addToast('success', t('messages.passwordInvitationEmailSent') || 'Password invitation email sent successfully');
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    }
  };

  const handleUserCreated = () => {
    addToast('success', t('messages.userCreatedSuccessfully') || 'User created successfully. Password setup email has been sent automatically.');
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

  const openModal = (data?: User | null) => {
    setModal({ type: 'user', data: data ?? null });
    setWasCreatingUser(!data); // Track if we're creating (no data) or editing (has data)
  };
  const closeModal = () => {
    setModal({ type: null });
    // Reset the flag after a short delay to allow the success check
    setTimeout(() => setWasCreatingUser(false), 100);
  };

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
          const profileLabelKey = user.profile ? `profile.${user.profile}` : 'profile.undefined';
          const profileDisplay = t(profileLabelKey) || user.profile || t('profile.undefined') || 'Undefined';
          const isPending = user.status === 2;
          return (
            <li key={user.id ?? index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{t('forms.profileLabel')}</span>
                      <span className="font-medium text-gray-700 capitalize">{profileDisplay}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{t('forms.statusLabel')}</span>
                      <StatusBadge value={user.status} />
                    </div>
                  </div>
                  {isPending && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-600 italic">
                        {t('messages.userPendingPasswordSetup') || 'User is pending password setup. An email was sent automatically.'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isPending && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResendInvitation(user.id)}
                      isLoading={sendInvitation.isPending}
                      disabled={sendInvitation.isPending}
                      className="text-xs"
                    >
                      {t('sections.resendInvitation') || 'Resend Invitation'}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRolesModalUser(user)}
                    className="text-xs"
                    title={t('sections.manageRoles') || 'Manage Roles'}
                  >
                    {t('sections.roles') || 'Roles'}
                  </Button>
                  <EditButton onClick={() => onEdit(user)} />
                  <DeleteButton onClick={() => onDelete(user.id)} />
                </div>
              </div>
            </li>
          );
        }}
      />

      {modal.type === 'user' && (
        <UserModal 
          isOpen 
          onClose={closeModal}
          user={modal.data} 
        />
      )}

      <UserRolesModal
        isOpen={!!rolesModalUser}
        user={rolesModalUser}
        onClose={() => setRolesModalUser(null)}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('forms.deleteUser')}
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
};

export default UsersSection;
