import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateSpecialization, useUpdateSpecialization } from '../../hooks/useSpecializations';
import { usePrograms, useProgram as useProgramById } from '../../hooks/usePrograms';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';

interface SpecializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialization?: any | null;
  initialProgramId?: number;
}

const SpecializationModal: React.FC<SpecializationModalProps> = ({ isOpen, onClose, specialization, initialProgramId }) => {
  const [form, setForm] = useState({
    title: '',
    program_id: '' as number | string | '',
    status: 1,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();
  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  
  // When editing, use the specialization's program ID; when creating, use initialProgramId
  const programIdForFetch = specialization 
    ? (specialization.program_id || specialization.program?.id || 0)
    : (initialProgramId || 0);
  const { data: selectedProgram } = useProgramById(programIdForFetch);

  const programs = useMemo(() => ((programsResp as any)?.data || []), [programsResp]);

  const isEditing = !!specialization;
  // Lock program when editing (specialization exists) or when creating with initialProgramId
  const isProgramLocked = !!specialization || !!initialProgramId;

  useEffect(() => {
    if (specialization) {
      setForm({
        title: specialization.title || '',
        program_id: specialization.program_id ?? specialization.program?.id ?? '',
        status: typeof specialization.status === 'number' ? specialization.status : 1,
        description: specialization.description || '',
      });
    } else {
      setForm({ title: '', program_id: initialProgramId ?? '', status: 1, description: '' });
    }
    setErrors({});
    setFormError('');
  }, [specialization, isOpen, initialProgramId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : (name === 'program_id' ? (value ? Number(value) : '') : value) }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.program_id) next.program_id = 'Program is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Save HTML as-is so it can be displayed with formatting
    const descriptionToSave = form.description.trim() || undefined;
    const payload = {
      title: form.title,
      program_id: Number(form.program_id),
      status: form.status,
      description: descriptionToSave,
      // company_id is automatically set by the API from authenticated user
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: specialization.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save specialization');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Specialization' : 'Add Specialization'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        
        {/* Program - moved to top */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Program</label>
          {isProgramLocked && (selectedProgram || specialization?.program) ? (
            <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
              <div className="text-sm font-medium text-gray-900">
                {selectedProgram?.title || specialization?.program?.title || 'N/A'}
              </div>
            </div>
          ) : (
            <select
              name="program_id"
              value={form.program_id}
              onChange={handleChange}
              disabled={isProgramLocked}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.program_id ? 'border-red-300' : 'border-gray-300'
              } ${isProgramLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Select a program</option>
              {programs.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}
          {errors.program_id && <p className="mt-1 text-sm text-red-600">{errors.program_id}</p>}
        </div>

        <Input
          label="Title"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => {
              setForm(prev => ({ ...prev, description: html }));
            }}
            placeholder="Describe the specialization..."
            rows={5}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SpecializationModal;


