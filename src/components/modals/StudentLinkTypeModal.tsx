import React from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentLinkType, useUpdateStudentLinkType } from '../../hooks/useStudentLinkTypes';
import { StudentLinkTypeForm, type StudentLinkType } from '../forms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: StudentLinkType | null;
}

const StudentLinkTypeModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const createMut = useCreateStudentLinkType();
  const updateMut = useUpdateStudentLinkType();

  const isEditing = !!item;

  const handleSubmit = async (formData: { title: string; status: number }) => {
    const base = { title: formData.title, status: formData.status } as any;
    if (isEditing && item) {
      await updateMut.mutateAsync({ id: item.id, data: base });
    } else {
      await createMut.mutateAsync(base);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Link Type' : 'Add Link Type'}>
      <StudentLinkTypeForm
        initialData={item}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />
    </BaseModal>
  );
};

export default StudentLinkTypeModal;


