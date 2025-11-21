import React, { useMemo } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentAttestation, useUpdateStudentAttestation } from '../../hooks/useStudentAttestations';
import { useStudents } from '../../hooks/useStudents';
import { useAttestations } from '../../hooks/useAttestations';
import { StudentAttestationForm, type StudentAttestation } from '../forms';

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
    datedelivery: string;
    Status: number;
  }) => {
    const payload = {
      Idstudent: Number(formData.Idstudent),
      Idattestation: Number(formData.Idattestation),
      dateask: formData.dateask || undefined,
      datedelivery: formData.datedelivery || undefined,
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
      const errorMessage = err?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        throw new Error(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        throw new Error(errorMessage);
      } else {
        throw new Error(err?.message || 'Failed to save student attestation');
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={studentAttestation ? 'Edit Student Attestation' : 'Add Student Attestation'}
    >
      <StudentAttestationForm
        initialData={studentAttestation}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        students={students as Array<{ id: number; first_name?: string; last_name?: string; email?: string }>}
        attestations={attestations as Array<{ id: number; title: string }>}
      />
    </BaseModal>
  );
};

export default StudentAttestationModal;
