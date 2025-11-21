import React, { useMemo } from 'react';
import BaseModal from './BaseModal';
import { useCreateSpecialization, useUpdateSpecialization } from '../../hooks/useSpecializations';
import { usePrograms, useProgram as useProgramById } from '../../hooks/usePrograms';
import { SpecializationForm, type Specialization } from '../forms';

interface SpecializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialization?: Specialization | null;
  initialProgramId?: number;
}

const SpecializationModal: React.FC<SpecializationModalProps> = ({
  isOpen,
  onClose,
  specialization,
  initialProgramId,
}) => {
  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();
  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);

  const programIdForFetch = specialization
    ? specialization.program_id || specialization.program?.id || 0
    : initialProgramId || 0;
  const { data: selectedProgram } = useProgramById(programIdForFetch);

  const programs = useMemo(() => ((programsResp as any)?.data || []), [programsResp]);

  const isEditing = !!specialization;
  const isProgramLocked = !!specialization || !!initialProgramId;

  const handleSubmit = async (formData: {
    title: string;
    program_id: number | string | '';
    status: number;
    description: string;
  }) => {
    const descriptionToSave = formData.description.trim() || undefined;
    const payload = {
      title: formData.title,
      program_id: Number(formData.program_id),
      status: formData.status,
      description: descriptionToSave,
    };
    if (isEditing && specialization) {
      await updateMutation.mutateAsync({ id: specialization.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Specialization' : 'Add Specialization'}>
      <SpecializationForm
        initialData={specialization}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        programs={programs}
        selectedProgram={selectedProgram || null}
        isProgramLocked={isProgramLocked}
        initialProgramId={initialProgramId}
      />
    </BaseModal>
  );
};

export default SpecializationModal;


