import React from 'react';
import { useTranslation } from 'react-i18next';
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
        // profile field is REMOVED - manage roles via /users/:id/roles endpoint
      };

      await updateUser.mutateAsync({ id: user.id, ...updateData });
    } else {
      // For new users: password is ALWAYS set via email link - NEVER provided through form
      // Roles are NOT assigned during creation - they will be assigned later via role button

      const createData = {
        username: formData.username,
        email: formData.email,
        company_id: companyId!,
        // role_ids is NOT included - roles will be assigned after user creation via role button
        // Password is NEVER included - backend always sends password setup email
        // profile field is REMOVED - replaced with roles system
      };

      // Backend will automatically send password setup email with secure token link
      // User must click the link to set their password
      // Roles will be assigned separately via /users/:id/roles endpoint
      await createUser.mutateAsync(createData);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? (t('sections.editUser') || 'Edit User') : (t('sections.addUser') || 'Add User')}
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
