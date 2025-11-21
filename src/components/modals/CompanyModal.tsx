import React from 'react';
import { useCreateCompany, useUpdateCompany } from '../../hooks/useCompanies';
import BaseModal from './BaseModal';
import { CompanyForm, type Company } from '../forms';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, company }) => {
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const isEditing = !!company;

  const handleSubmit = async (formData: { name: string; email: string; phone: string; website: string }) => {
    if (isEditing && company) {
      await updateCompany.mutateAsync({
        id: company.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
      });
    } else {
      await createCompany.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
      });
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Company' : 'Add Company'}
    >
      <CompanyForm
        initialData={company}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createCompany.isPending || updateCompany.isPending}
      />
    </BaseModal>
  );
};

export default CompanyModal;
