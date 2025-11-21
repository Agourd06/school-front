import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateClass, useUpdateClass } from '../../hooks/useClasses';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import DescriptionModal from './DescriptionModal';
import { ClassForm, type Class } from '../forms';
import type { CreateClassRequest } from '../../api/classes';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem?: Class | null;
  descriptionPosition?: 'top' | 'bottom';
}

const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  classItem,
  descriptionPosition = 'top',
}) => {
  const [formState, setFormState] = useState({
    program_id: '' as number | string | '',
    specialization_id: '' as number | string | '',
    school_year_id: '' as number | string | '',
  });
  const [formError, setFormError] = useState('');
  const [isDescriptionPreviewOpen, setIsDescriptionPreviewOpen] = useState(false);

  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = useMemo(() => ((programsResp as any)?.data || []) as any[], [programsResp]);

  const { data: specializationsResp } = useSpecializations({
    page: 1,
    limit: 100,
    program_id: formState.program_id ? Number(formState.program_id) : undefined,
  } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);

  const { data: levelsResp } = useLevels({
    page: 1,
    limit: 100,
    specialization_id: formState.specialization_id ? Number(formState.specialization_id) : undefined,
  } as any);
  const levels = useMemo(() => ((levelsResp as any)?.data || []) as any[], [levelsResp]);

  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 } as any);
  const schoolYears = useMemo(() => ((schoolYearsResp as any)?.data || []) as any[], [schoolYearsResp]);

  const { data: periodsResp } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: formState.school_year_id ? Number(formState.school_year_id) : undefined,
  } as any);
  const periods = useMemo(() => ((periodsResp as any)?.data || []) as any[], [periodsResp]);

  useEffect(() => {
    if (classItem) {
      setFormState({
        program_id: classItem.program_id ?? classItem.program?.id ?? '',
        specialization_id: classItem.specialization_id ?? classItem.specialization?.id ?? '',
        school_year_id: classItem.school_year_id ?? classItem.schoolYear?.id ?? '',
      });
    } else {
      setFormState({
        program_id: '',
        specialization_id: '',
        school_year_id: '',
      });
    }
  }, [classItem, isOpen]);

  const handleFormChange = (formData: {
    program_id: number | string | '';
    specialization_id: number | string | '';
    school_year_id: number | string | '';
  }) => {
    setFormState({
      program_id: formData.program_id,
      specialization_id: formData.specialization_id,
      school_year_id: formData.school_year_id,
    });
  };

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    program_id: number | string | '';
    specialization_id: number | string | '';
    level_id: number | string | '';
    school_year_id: number | string | '';
    school_year_period_id: number | string | '';
    status: number;
  }) => {
    setFormError('');
    const payload: CreateClassRequest = {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      status: formData.status,
      program_id: Number(formData.program_id),
      specialization_id: Number(formData.specialization_id),
      level_id: Number(formData.level_id),
      school_year_id: Number(formData.school_year_id),
      ...(formData.school_year_period_id && { school_year_period_id: Number(formData.school_year_period_id) }),
    };

    try {
      if (classItem?.id) {
        await updateMutation.mutateAsync({ id: classItem.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save class');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={classItem ? 'Edit Class' : 'Add Class'}>
      <ClassForm
        initialData={classItem}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={formError}
        programs={programs}
        specializations={specializations}
        levels={levels}
        schoolYears={schoolYears}
        periods={periods}
        descriptionPosition={descriptionPosition}
        onDescriptionPreview={() => setIsDescriptionPreviewOpen(true)}
      />
      {isDescriptionPreviewOpen && (
        <DescriptionModal
          isOpen
          onClose={() => setIsDescriptionPreviewOpen(false)}
          title={classItem?.title || ''}
          description={''}
          type="class"
        />
      )}
    </BaseModal>
  );
};

export default ClassModal;
