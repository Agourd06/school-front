import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import type { ClassCourse } from '../../api/classCourse';
import { ClassCourseForm, type ClassCourseFormData } from '../forms';
import type { SearchSelectOption } from '../inputs/SearchSelect';

export type ClassCourseFormValues = ClassCourseFormData;

interface ClassCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ClassCourse | null;
  onSubmit: (values: ClassCourseFormValues) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
  moduleOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  teacherOptions: SearchSelectOption[];
}

const ClassCourseModal: React.FC<ClassCourseModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  serverError,
  moduleOptions,
  courseOptions,
  teacherOptions,
}) => {
  const { t } = useTranslation();
  const handleSubmit = async (values: ClassCourseFormData) => {
    await onSubmit(values);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? t('forms.editClassCourse') : t('forms.addClassCourse')}>
      <ClassCourseForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        moduleOptions={moduleOptions}
        courseOptions={courseOptions}
        teacherOptions={teacherOptions}
      />
    </BaseModal>
  );
};

export default ClassCourseModal;


