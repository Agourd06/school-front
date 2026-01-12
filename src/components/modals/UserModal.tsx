import React from 'react';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useCompanyId } from '../../hooks/useCompanyId';
import BaseModal from './BaseModal';
import { UserForm, type User, type UserFormData } from '../forms';
import type { UpdateUserRequest } from '../../api/users';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user }) => {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const companyId = useCompanyId();

  const isEditing = !!user;

  const handleSubmit = async (formData: UserFormData) => {
    if (isEditing && user) {
      const updateData: UpdateUserRequest = {
        username: formData.username,
        email: formData.email,
        profile: formData.profile as any,
      };

      await updateUser.mutateAsync({ id: user.id, ...updateData });
    } else {
      // For new users: password is always sent via email automatically
      const createData = {
        username: formData.username,
        email: formData.email,
        profile: formData.profile as any,
        company_id: companyId,
      };

      // Backend will automatically send invitation email when password is not provided
      await createUser.mutateAsync(createData);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Add User'}
    >
      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createUser.isPending || updateUser.isPending}
      />
    </BaseModal>
  );
};

export default UserModal;
