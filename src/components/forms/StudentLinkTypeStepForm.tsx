import React from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

interface StudentLinkTypeStepFormProps {
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

const StudentLinkTypeStepForm: React.FC<StudentLinkTypeStepFormProps> = ({
  title,
  status,
  error,
  onTitleChange,
  onStatusChange,
  onSubmit,
  onBack,
  isSubmitting,
  hasLinkType,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          error={error}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(Number(e.target.value))}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {hasLinkType ? 'Update & Finish' : 'Save & Finish'}
        </Button>
      </div>
    </form>
  );
};

export default StudentLinkTypeStepForm;

