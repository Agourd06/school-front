import React, { useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateLevel, useUpdateLevel } from '../../hooks/useLevels';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations, useSpecialization as useSpecializationById } from '../../hooks/useSpecializations';
import { LevelForm, type Level } from '../forms';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  level?: Level | null;
  initialSpecializationId?: number;
}

const LevelModal: React.FC<LevelModalProps> = ({ isOpen, onClose, level, initialSpecializationId }) => {
  const [formState, setFormState] = useState({
    program_id: '' as number | string | '',
    specialization_id: '' as number | string | '',
  });
  const [formError, setFormError] = useState('');

  const createMutation = useCreateLevel();
  const updateMutation = useUpdateLevel();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = useMemo(() => ((programsResp as any)?.data || []) as any[], [programsResp]);

  const specializationIdForFetch = level
    ? level.specialization_id || level.specialization?.id || 0
    : initialSpecializationId || 0;
  const { data: selectedSpecialization } = useSpecializationById(specializationIdForFetch);

  const programFromLevel = level?.specialization?.program;
  const programFromSpecialization = selectedSpecialization?.program;
  const programIdForLookup = level
    ? level.specialization?.program?.id || level.specialization?.program_id
    : selectedSpecialization?.program_id;
  const fetchedProgram = useMemo(() => {
    if (programFromLevel) return programFromLevel;
    if (programFromSpecialization) return programFromSpecialization;
    if (programIdForLookup) {
      return programs.find((p: any) => p.id === programIdForLookup);
    }
    return null;
  }, [programFromLevel, programFromSpecialization, programIdForLookup, programs]);

  const { data: specializationsResp } = useSpecializations({
    page: 1,
    limit: 100,
    program_id: formState.program_id
      ? Number(formState.program_id)
      : selectedSpecialization?.program_id
      ? selectedSpecialization.program_id
      : undefined,
  } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);

  const isProgramLocked = !!level || !!initialSpecializationId;
  const isSpecializationLocked = !!level || !!initialSpecializationId;

  const handleFormChange = (formData: { program_id: number | string | ''; specialization_id: number | string | '' }) => {
    setFormState({
      program_id: formData.program_id,
      specialization_id: formData.specialization_id,
    });
  };

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    level: string;
    specialization_id: number | string | '';
    status: number;
  }) => {
    setFormError('');
    const descriptionToSave = formData.description.trim() || undefined;
    const payload = {
      title: formData.title,
      description: descriptionToSave,
      level: formData.level ? Number(formData.level) : undefined,
      specialization_id: Number(formData.specialization_id),
      status: formData.status,
    };
    try {
      if (level?.id) {
        await updateMutation.mutateAsync({ id: level.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save level');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={level ? 'Edit Level' : 'Add Level'}>
      <LevelForm
        initialData={level}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={formError}
        programs={programs}
        specializations={specializations}
        selectedSpecialization={selectedSpecialization || null}
        fetchedProgram={fetchedProgram || null}
        isProgramLocked={isProgramLocked}
        isSpecializationLocked={isSpecializationLocked}
        initialSpecializationId={initialSpecializationId}
        onFormChange={handleFormChange}
      />
    </BaseModal>
  );
};

export default LevelModal;
