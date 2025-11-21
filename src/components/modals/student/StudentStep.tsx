import React from 'react';
import StudentStepForm from '../../forms/StudentStepForm';
import type { StudentFormData } from './types';

interface StudentStepProps {
  form: StudentFormData;
  errors: Record<string, string>;
  pictureFile: File | null;
  currentPictureUrl?: string | null;
  classRooms: PaginatedResponse<ClassRoom> | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const StudentStep: React.FC<StudentStepProps> = (props) => {
  return <StudentStepForm {...props} />;
};

export default StudentStep;

