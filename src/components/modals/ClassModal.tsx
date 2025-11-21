import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateClass, useUpdateClass } from '../../hooks/useClasses';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import DescriptionModal from './DescriptionModal';
import { Input, Select, Button } from '../ui';
import type { CreateClassRequest } from '../../api/classes';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem?: any | null;
  descriptionPosition?: 'top' | 'bottom';
}

const ClassModal: React.FC<ClassModalProps> = ({ isOpen, onClose, classItem, descriptionPosition = 'top' }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    program_id: '' as number | string | '',
    specialization_id: '' as number | string | '',
    level_id: '' as number | string | '',
    school_year_id: '' as number | string | '',
    school_year_period_id: '' as number | string | '',
    status: 1,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isDescriptionPreviewOpen, setIsDescriptionPreviewOpen] = useState(false);

  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = useMemo(() => ((programsResp as any)?.data || []) as any[], [programsResp]);

  const { data: specializationsResp } = useSpecializations({ page: 1, limit: 100, program_id: form.program_id ? Number(form.program_id) : undefined } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);

  const { data: levelsResp } = useLevels({ page: 1, limit: 100, specialization_id: form.specialization_id ? Number(form.specialization_id) : undefined } as any);
  const levels = useMemo(() => ((levelsResp as any)?.data || []) as any[], [levelsResp]);

  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 } as any);
  const schoolYears = useMemo(() => ((schoolYearsResp as any)?.data || []) as any[], [schoolYearsResp]);

  const { data: periodsResp } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: form.school_year_id ? Number(form.school_year_id) : undefined,
  } as any);
  const periods = useMemo(() => ((periodsResp as any)?.data || []) as any[], [periodsResp]);

  const isEditing = !!classItem;

  useEffect(() => {
    if (classItem) {
      setForm({
        title: classItem.title || '',
        description: classItem.description || '',
        program_id: classItem.program_id ?? classItem.program?.id ?? '',
        specialization_id: classItem.specialization_id ?? classItem.specialization?.id ?? '',
        level_id: classItem.level_id ?? classItem.level?.id ?? '',
        school_year_id: classItem.school_year_id ?? classItem.schoolYear?.id ?? '',
        school_year_period_id: classItem.school_year_period_id ?? classItem.schoolYearPeriod?.id ?? '',
        status: typeof classItem.status === 'number' ? classItem.status : 1,
      });
    } else {
      setForm({
        title: '',
        description: '',
        program_id: '',
        specialization_id: '',
        level_id: '',
        school_year_id: '',
        school_year_period_id: '',
        status: 1,
      });
    }
    setErrors({});
    setFormError('');
  }, [classItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      let nextValue: any = value;
      if (name === 'status') nextValue = Number(value);
      if (['program_id', 'specialization_id', 'level_id', 'school_year_id', 'school_year_period_id'].includes(name)) {
        nextValue = value ? Number(value) : '';
      }
      const updated = { ...prev, [name]: nextValue };
      if (name === 'program_id') {
        updated.specialization_id = '';
        updated.level_id = '';
      }
      if (name === 'specialization_id') {
        updated.level_id = '';
      }
      if (name === 'school_year_id') {
        updated.school_year_period_id = '';
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.school_year_id) next.school_year_id = 'School year is required';
    // school_year_period_id is optional
    if (!form.program_id) next.program_id = 'Program is required';
    if (!form.specialization_id) next.specialization_id = 'Specialization is required';
    if (!form.level_id) next.level_id = 'Level is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormError('');
    const payload: CreateClassRequest = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      status: form.status,
      // company_id is automatically set by the API from authenticated user
      program_id: Number(form.program_id),
      specialization_id: Number(form.specialization_id),
      level_id: Number(form.level_id),
      school_year_id: Number(form.school_year_id),
      ...(form.school_year_period_id && { school_year_period_id: Number(form.school_year_period_id) }),
    };
        
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: classItem.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save class');
    }
  };

  const descriptionEditor = (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700 mb-0">Description</label>
        <button
          type="button"
          onClick={() => setIsDescriptionPreviewOpen(true)}
          className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          View details
        </button>
      </div>
      <RichTextEditor
        value={form.description}
        onChange={(html) => setForm(prev => ({ ...prev, description: html }))}
        placeholder="Describe the class..."
        rows={10}
      />
    </div>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Class' : 'Add Class'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}

        {/* Title and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title *"
            name="title"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS_FORM.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {descriptionPosition === 'top' && descriptionEditor}

        {/* School Year and Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="School Year *"
            name="school_year_id"
            value={form.school_year_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select school year' },
              ...(schoolYears.map(year => ({
                value: year.id,
                label: year.title,
              })))
            ]}
            error={errors.school_year_id}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Select
            label="School Year Period"
            name="school_year_period_id"
            value={form.school_year_period_id}
            onChange={handleChange}
            disabled={!form.school_year_id}
            options={[
              { value: '', label: 'Select period (optional)' },
              ...(periods.map(period => ({
                value: period.id,
                label: period.title,
              })))
            ]}
            error={errors.school_year_period_id}
            className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!form.school_year_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Program, Specialization, and Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Program *"
            name="program_id"
            value={form.program_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select program' },
              ...(programs.map(program => ({
                value: program.id,
                label: program.title,
              })))
            ]}
            error={errors.program_id}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Select
            label="Specialization *"
            name="specialization_id"
            value={form.specialization_id}
            onChange={handleChange}
            disabled={!form.program_id}
            options={[
              { value: '', label: 'Select specialization' },
              ...(specializations.map(spec => ({
                value: spec.id,
                label: spec.title,
              })))
            ]}
            error={errors.specialization_id}
            className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!form.program_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>

        <Select
          label="Level *"
          name="level_id"
          value={form.level_id}
          onChange={handleChange}
          disabled={!form.specialization_id}
          options={[
            { value: '', label: 'Select level' },
            ...(levels.map(level => ({
              value: level.id,
              label: level.title,
            })))
          ]}
          error={errors.level_id}
          className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!form.specialization_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />

        {descriptionPosition === 'bottom' && descriptionEditor}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
      {isDescriptionPreviewOpen && (
        <DescriptionModal
          isOpen
          onClose={() => setIsDescriptionPreviewOpen(false)}
          title={form.title || classItem?.title || ''}
          description={form.description}
          type="class"
        />
      )}
    </BaseModal>
  );
};

export default ClassModal;


