import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTableGeneric from '../../components/DataTableGeneric';
import { 
  useUsers, 
  useUpdateUser, 
  useSendPasswordInvitationById,
  useCreateUser 
} from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import type { FilterParams, ListState } from '../../types/api';
import { UserModal, DeleteModal } from '../../components/modals';
import { STATUS_OPTIONS } from '../../constants/status';
import { Users } from 'lucide-react';
import { ToastContainer, type ToastType } from '../ui/Toast';
import type { User } from '../../api/users';
import UserRolesModal from '../modals/UserRolesModal';
import UserRow from '../UserRow';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const UsersSection: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth(); // Get current logged-in user
  
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
      // Filter out current user from the data
      const filteredData = currentUser?.id 
        ? response.data.filter(user => user.id !== currentUser.id)
        : response.data;
      
      setState(prev => ({
        ...prev,
        data: filteredData,
        loading: isLoading,
        error: (error as { message?: string })?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error, currentUser?.id]);

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
    // Prevent deleting self
    if (currentUser?.id === id) {
      addToast('error', t('messages.cannotDeleteYourself') || 'You cannot delete your own account');
      return;
    }
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
    // Prevent editing self
    if (data && currentUser?.id === data.id) {
      addToast('error', t('messages.cannotEditYourself') || 'You cannot edit your own account');
      return;
    }
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
        titleKey="pages.usersTitle"
        descriptionKey="pages.usersDescription"
        icon={<Users className="w-5 h-5" />}
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
        searchPlaceholder={t('sections.searchByName') || 'Search by name...'}
        filterOptions={STATUS_OPTIONS}
        renderRow={(user: User, onEdit, onDelete, index) => {
          const isCurrentUser = currentUser?.id === user.id;
          
          return (
            <UserRow
              key={user.id ?? index}
              user={user}
              isCurrentUser={isCurrentUser}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageRoles={(user) => setRolesModalUser(user)}
              onResendInvitation={handleResendInvitation}
              isResendingInvitation={sendInvitation.isPending}
            />
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
