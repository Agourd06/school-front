import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { useCreateProgram, useUpdateProgram } from '../../hooks/usePrograms';
import { ProgramForm, type Program } from '../forms';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program?: Program | null;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, program }) => {
  const { t } = useTranslation();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  const isEditing = !!program;

  const handleSubmit = async (formData: { title: string; description: string; status: number; pdf_file?: File | null }) => {
    const descriptionToSave = formData.description.trim() || undefined;
    const hasPdf = formData.pdf_file instanceof File;

    // If PDF is provided, use FormData
    if (hasPdf) {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      if (descriptionToSave) {
        formDataToSend.append('description', descriptionToSave);
      }
      formDataToSend.append('status', formData.status.toString());
      if (formData.pdf_file instanceof File) {
        formDataToSend.append('pdf_file', formData.pdf_file);
      }

      if (isEditing && program) {
        await updateMutation.mutateAsync({
          id: program.id,
          formData: formDataToSend,
        });
      } else {
        await createMutation.mutateAsync(formDataToSend as any);
      }
    } else {
      // No PDF, use regular JSON
      if (isEditing && program) {
        await updateMutation.mutateAsync({
          id: program.id,
          title: formData.title.trim(),
          description: descriptionToSave,
          status: formData.status,
        });
      } else {
        await createMutation.mutateAsync({
          title: formData.title.trim(),
          description: descriptionToSave,
          status: formData.status,
        });
      }
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? t('sections.editProgram') : t('sections.addProgram')}>
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


