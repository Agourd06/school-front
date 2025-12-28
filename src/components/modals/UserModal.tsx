import React from 'react';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useCompanyId } from '../../hooks/useCompanyId';
import BaseModal from './BaseModal';
import { UserForm, type User } from '../forms';
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

  const handleSubmit = async (formData: { username: string; email: string; password: string; role: 'user' | 'admin' }) => {
    if (isEditing && user) {
      const updateData: UpdateUserRequest & { password?: string } = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        (updateData as { password: string }).password = formData.password;
      }

      await updateUser.mutateAsync({ id: user.id, ...updateData });
    } else {
      await createUser.mutateAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        company_id: companyId,
      });
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
