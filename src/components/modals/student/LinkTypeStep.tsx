import React from 'react';
import StudentLinkTypeStepForm from '../../forms/StudentLinkTypeStepForm';

interface LinkTypeStepProps {
  title: string;
  status: number;
  error: string;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isSubmitting: boolean;
  hasLinkType: boolean;
}

const LinkTypeStep: React.FC<LinkTypeStepProps> = (props) => {
  return <StudentLinkTypeStepForm {...props} />;
};

export default LinkTypeStep;

