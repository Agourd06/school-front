import React, { useState, useEffect } from 'react';
import { useCreateSchoolYear, useUpdateSchoolYear } from '../../hooks/useSchoolYears';
import BaseModal from './BaseModal';
import { validateRequired, validateDateOrder } from './validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { SchoolYear } from '../../api/schoolYear';

interface SchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolYear?: SchoolYear | null;
}

const SchoolYearModal: React.FC<SchoolYearModalProps> = ({ isOpen, onClose, schoolYear }) => {
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    status: 1,
    lifecycle_status: 'planned' as 'planned' | 'ongoing' | 'completed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSchoolYear = useCreateSchoolYear();
  const updateSchoolYear = useUpdateSchoolYear();

  const isEditing = !!schoolYear;
  const schoolYearIdRef = React.useRef<number | null>(null);
  const isInitializedRef = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset refs when modal closes
      schoolYearIdRef.current = null;
      isInitializedRef.current = false;
      return;
    }

    // Only reset form when schoolYear actually changes (different ID) or when first opening
    const currentId = schoolYear?.id ?? null;
    if (!isInitializedRef.current || currentId !== schoolYearIdRef.current) {
      schoolYearIdRef.current = currentId;
      isInitializedRef.current = true;
      
      if (schoolYear) {
        setFormData({
          title: schoolYear.title || '',
          start_date: schoolYear.start_date || '',
          end_date: schoolYear.end_date || '',
          status: schoolYear.status || 1,
          lifecycle_status: (schoolYear.lifecycle_status || 'planned') as 'planned' | 'ongoing' | 'completed',
        });
      } else {
        setFormData({
          title: '',
          start_date: '',
          end_date: '',
          status: 1,
          lifecycle_status: 'planned',
        });
      }
      setErrors({});
    }
  }, [schoolYear, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateRequired(formData.title, 'Title');
    if (titleErr) newErrors.title = titleErr;
    const startErr = validateRequired(formData.start_date, 'Start date');
    if (startErr) newErrors.start_date = startErr;
    const endErr = validateRequired(formData.end_date, 'End date');
    if (endErr) newErrors.end_date = endErr;
    const orderErr = validateDateOrder(formData.start_date, formData.end_date, { start: 'start date', end: 'end date' });
    if (!newErrors.start_date && !newErrors.end_date && orderErr) newErrors.end_date = orderErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // companyId is automatically set by the API from authenticated user
      const payload = {
        title: formData.title.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: Number(formData.status),
        lifecycle_status: formData.lifecycle_status,
      };
      
      if (isEditing && schoolYear) {
        await updateSchoolYear.mutateAsync({
          id: schoolYear.id,
          ...payload,
        });
      } else {
        await createSchoolYear.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('SchoolYear operation failed:', error);
      alert('Operation failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'status' ? Number(value) : 
                     name === 'lifecycle_status' ? value as 'planned' | 'ongoing' | 'completed' : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit School Year' : 'Add School Year'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Start Date"
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          error={errors.start_date}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="End Date"
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          error={errors.end_date}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Select
          label="Lifecycle Status"
          name="lifecycle_status"
          value={formData.lifecycle_status}
          onChange={handleChange}
          options={[
            { value: 'planned', label: 'Planned' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map(opt => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createSchoolYear.isPending || updateSchoolYear.isPending}
            disabled={createSchoolYear.isPending || updateSchoolYear.isPending}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SchoolYearModal;
