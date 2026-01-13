import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { useCreateRole, useUpdateRole } from '../../hooks/useRoles';
import RoleForm, { type RoleFormData } from '../forms/RoleForm';
import type { Role } from '../../api/roles';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
}

const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, role }) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const isEditing = !!role;

  const handleSubmit = async (formData: RoleFormData) => {
    setFormError(null);

    try {
      if (isEditing && role) {
        // Update: only label can be changed, code cannot
        const updateData = {
          label: formData.label,
        };
        await updateMutation.mutateAsync({ id: role.id, data: updateData });
      } else {
        // Create: code and label required, is_system must be false
        const createData = {
          code: formData.code,
          label: formData.label,
          is_system: false, // Always false for custom roles
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = error?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setFormError(errorMessage.join(', '));
      } else {
        setFormError(errorMessage || error?.message || t('forms.failedToSaveRole') || 'Failed to save role');
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? (t('sections.editRole') || 'Edit Role') : (t('sections.addRole') || 'Add Role')}
    >
      <RoleForm
        initialData={role}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={formError}
      />
    </BaseModal>
  );
};

export default RoleModal;
