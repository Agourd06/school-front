import React from 'react';
import StudentContactStepForm from '../../forms/StudentContactStepForm';
import type { ContactFormData } from './types';
import type { StudentLinkType } from '../../../api/studentLinkType';
import type { PaginatedResponse } from '../../../types/api';

interface ContactStepProps {
  form: ContactFormData;
  errors: Record<string, string>;
  linkTypesData: PaginatedResponse<StudentLinkType> | null | undefined;
  studentName: string;
  onFormChange: (field: keyof ContactFormData, value: string | number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasContact: boolean;
}

const ContactStep: React.FC<ContactStepProps> = (props) => {
  return <StudentContactStepForm {...props} />;
};

export default ContactStep;

