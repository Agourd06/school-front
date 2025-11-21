import React from 'react';
import StudentContactStepForm from '../../forms/StudentContactStepForm';
import type { ContactFormData } from './types';

interface ContactStepProps {
  form: ContactFormData;
  errors: Record<string, string>;
  linkTypesData: any;
  studentName: string;
  onFormChange: (field: keyof ContactFormData, value: any) => void;
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

