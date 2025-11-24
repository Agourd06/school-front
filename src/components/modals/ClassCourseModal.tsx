import React from 'react';
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
  classOptions: SearchSelectOption[];
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
  classOptions,
  moduleOptions,
  courseOptions,
  teacherOptions,
}) => {
  const handleSubmit = async (values: ClassCourseFormData) => {
    await onSubmit(values);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Class Course' : 'Add Class Course'}>
      <ClassCourseForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        classOptions={classOptions}
        moduleOptions={moduleOptions}
        courseOptions={courseOptions}
        teacherOptions={teacherOptions}
      />
    </BaseModal>
  );
};

export default ClassCourseModal;


