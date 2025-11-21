import React from 'react';
import BaseModal from './BaseModal';
import { useCreateAttestation, useUpdateAttestation } from '../../hooks/useAttestations';
import { AttestationForm } from '../forms';
import type { Attestation } from '../../api/attestation';

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attestation?: Attestation | null;
}

const AttestationModal: React.FC<AttestationModalProps> = ({ isOpen, onClose, attestation }) => {
  const createMutation = useCreateAttestation();
  const updateMutation = useUpdateAttestation();

  const isEditing = !!attestation;

  const handleSubmit = async (formData: { title: string; description: string; statut: number }) => {
    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      statut: formData.statut,
    };
    if (isEditing && attestation) {
      await updateMutation.mutateAsync({ id: attestation.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Attestation' : 'Add Attestation'}>
      <AttestationForm
        initialData={attestation}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </BaseModal>
  );
};

export default AttestationModal;

