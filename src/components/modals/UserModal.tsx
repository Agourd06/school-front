import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useCompanyId } from '../../hooks/useCompanyId';
import BaseModal from './BaseModal';
import { UserForm, type User, type UserFormData } from '../forms';
import type { UpdateUserRequest, CreateUserRequest } from '../../api/users';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const companyId = useCompanyId();

  const isEditing = !!user;

  const handleSubmit = async (formData: UserFormData) => {
    if (isEditing && user) {
      const updateData: UpdateUserRequest = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        picture: formData.picture || undefined,
      };

      await updateUser.mutateAsync({ id: user.id, ...updateData });
    } else {
      const createData: CreateUserRequest = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        picture: formData.picture || undefined,
        company_id: companyId!,
      };

      await createUser.mutateAsync(createData);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? (t('sections.editUser') || 'Edit User') : (t('sections.addUser') || 'Add User')}
      className="!w-full !max-w-xl"
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
