import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { useCreateStudentAttestation, useUpdateStudentAttestation } from '../../hooks/useStudentAttestations';
import { useStudents } from '../../hooks/useStudents';
import { useAttestations } from '../../hooks/useAttestations';
import { StudentAttestationForm, type StudentAttestation } from '../forms';
import type { Student } from '../../api/students';
import type { Attestation } from '../../api/attestation';

interface StudentAttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentAttestation?: StudentAttestation | null;
}

const StudentAttestationModal: React.FC<StudentAttestationModalProps> = ({
  isOpen,
  onClose,
  studentAttestation,
}) => {
  const { t } = useTranslation();
  const createMutation = useCreateStudentAttestation();
  const updateMutation = useUpdateStudentAttestation();
  const { data: studentsResp } = useStudents({ page: 1, limit: 100 });
  const { data: attestationsResp } = useAttestations({ page: 1, limit: 100 });

  const students = useMemo(() => (studentsResp?.data || []) as Student[], [studentsResp]);
  const attestations = useMemo(() => (attestationsResp?.data || []) as Attestation[], [attestationsResp]);

  const handleSubmit = async (formData: {
    Idstudent: number | string | '';
    Idattestation: number | string | '';
    dateask: string;
    datedelivery?: string;
    description?: string;
    Status: number;
  }) => {
    const payload = {
      Idstudent: Number(formData.Idstudent),
      Idattestation: Number(formData.Idattestation),
      dateask: formData.dateask || undefined,
      datedelivery: formData.datedelivery ? formData.datedelivery : undefined,
      description: formData.description?.trim() ? formData.description.trim() : undefined,
      Status: formData.Status,
    };
    try {
      if (studentAttestation?.id) {
        await updateMutation.mutateAsync({ id: studentAttestation.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = error?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        throw new Error(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        throw new Error(errorMessage);
      } else {
        throw new Error(error?.message || t('forms.failedToSaveStudentAttestation'));
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={studentAttestation ? t('sections.editStudentAttestation') : t('sections.addStudentAttestation')}
    >
      <StudentAttestationForm
        initialData={studentAttestation}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        students={students as Array<{ id: number; first_name?: string; last_name?: string; email?: string; birthday?: string }>}
        attestations={attestations.map((att) => ({
          id: att.id,
          title: att.title,
          description: att.description ?? null,
        }))}
      />
    </BaseModal>
  );
};

export default StudentAttestationModal;
