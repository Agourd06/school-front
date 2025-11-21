import React from 'react';
import { Input, Select, Button } from '../../ui';
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

const ContactStep: React.FC<ContactStepProps> = ({
  form,
  errors,
  linkTypesData,
  studentName,
  onFormChange,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
  hasContact,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Student"
          value={studentName}
          disabled
          className="bg-gray-100 border-gray-200"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.firstname}
          onChange={(e) => onFormChange('firstname', e.target.value)}
          error={errors.firstname}
        />
        <Input
          label="Last name"
          value={form.lastname}
          onChange={(e) => onFormChange('lastname', e.target.value)}
          error={errors.lastname}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Birthday"
          type="date"
          value={form.birthday}
          onChange={(e) => onFormChange('birthday', e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => onFormChange('email', e.target.value)}
          error={errors.email}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => onFormChange('phone', e.target.value)}
        />
        <Select
          label="Link type"
          value={form.studentlinktypeId}
          onChange={(e) => onFormChange('studentlinktypeId', e.target.value ? Number(e.target.value) : '')}
          options={[
            { value: '', label: 'Select link type' },
            ...((linkTypesData?.data || []).map((lt: any) => ({
              value: lt.id,
              label: lt.title,
            })))
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Adress"
          value={form.adress}
          onChange={(e) => onFormChange('adress', e.target.value)}
        />
        <Input
          label="City"
          value={form.city}
          onChange={(e) => onFormChange('city', e.target.value)}
        />
        <Input
          label="Country"
          value={form.country}
          onChange={(e) => onFormChange('country', e.target.value)}
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
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {hasContact ? 'Update & Continue' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ContactStep;

