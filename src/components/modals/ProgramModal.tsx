import React from 'react';
import BaseModal from './BaseModal';
import { useCreateProgram, useUpdateProgram } from '../../hooks/usePrograms';
import { ProgramForm, type Program } from '../forms';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program?: Program | null;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, program }) => {
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  const isEditing = !!program;

  const handleSubmit = async (formData: { title: string; description: string; status: number }) => {
    const descriptionToSave = formData.description.trim() || undefined;
    if (isEditing && program) {
      await updateMutation.mutateAsync({
        id: program.id,
        data: {
          title: formData.title.trim(),
          description: descriptionToSave,
          status: formData.status,
        },
      });
    } else {
      await createMutation.mutateAsync({
        title: formData.title.trim(),
        description: descriptionToSave,
        status: formData.status,
      });
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Program' : 'Add Program'}>
      <ProgramForm
        initialData={program}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </BaseModal>
  );
};

export default ProgramModal;


