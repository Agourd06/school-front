import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { useCreateTeacher, useUpdateTeacher } from '../../hooks/useTeachers';
import { TeacherForm, type Teacher } from '../forms';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, teacher }) => {
  const { t } = useTranslation();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = !!teacher;

  const handleSubmit = async (
    formData: {
      gender: string;
      first_name: string;
      last_name: string;
      birthday: string;
      email: string;
      email2: string;
      phone: string;
      phone2: string;
      address: string;
      codePostal: string;
      city: string;
      country: string;
      nationality: string;
      picture: string;
      status: number;
    },
    pictureFile: File | null
  ) => {
    setServerError(null);
    
    const formDataObj = new FormData();
    formDataObj.append('first_name', formData.first_name);
    formDataObj.append('last_name', formData.last_name);
    formDataObj.append('email', formData.email);
    formDataObj.append('codePostal', formData.codePostal); // Required field
    if (formData.gender) formDataObj.append('gender', formData.gender);
    if (formData.birthday) formDataObj.append('birthday', formData.birthday);
    if (formData.phone) formDataObj.append('phone', formData.phone);
    if (formData.phone2) formDataObj.append('phone2', formData.phone2);
    if (formData.email2) formDataObj.append('email2', formData.email2);
    if (formData.address) formDataObj.append('address', formData.address);
    if (formData.city) formDataObj.append('city', formData.city);
    if (formData.country) formDataObj.append('country', formData.country);
    if (formData.nationality) formDataObj.append('nationality', formData.nationality);
    // For new teachers, always set status to 2 (pending)
    // For editing, use the form status
    if (isEditing) {
      if (formData.status != null) formDataObj.append('status', String(formData.status));
    } else {
      // New teacher: always set to pending (2)
      formDataObj.append('status', '2');
    }
    if (pictureFile instanceof File) formDataObj.append('picture', pictureFile, pictureFile.name);

    try {
      if (isEditing && teacher?.id) {
        await updateMutation.mutateAsync({ id: teacher.id, data: formDataObj });
      } else {
        await createMutation.mutateAsync(formDataObj);
      }
      onClose();
      setServerError(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; statusCode?: number } } };
      const message = axiosError?.response?.data?.message || 'Failed to save teacher';
      
      // Check if the error is related to email validation (duplicate email, etc.)
      const messageLower = message.toLowerCase();
      if (
        messageLower.includes('email') ||
        messageLower.includes('teacher with email') ||
        messageLower.includes('user with email') ||
        messageLower.includes('already exists')
      ) {
        // Set error on email field for better UX - this will be handled by TeacherForm
        setServerError(message);
      } else {
        // For other errors, show as form error
        setServerError(message);
      }
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? t('sections.editTeacher') : t('sections.addTeacher')}>
      <TeacherForm
        initialData={teacher}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={serverError}
      />
    </BaseModal>
  );
};

export default TeacherModal;
