import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateLevel, useUpdateLevel } from '../../hooks/useLevels';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { STATUS_OPTIONS, DEFAULT_COMPANY_ID } from '../../constants/status';
import RichTextEditor from '../RichTextEditor';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  level?: any | null;
}

const LevelModal: React.FC<LevelModalProps> = ({ isOpen, onClose, level }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: '' as string,
    specialization_id: '' as number | string | '',
    program_id: '' as number | string | '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const createMutation = useCreateLevel();
  const updateMutation = useUpdateLevel();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = useMemo(() => ((programsResp as any)?.data || []) as any[], [programsResp]);

  const { data: specializationsResp } = useSpecializations({ page: 1, limit: 100, program_id: form.program_id ? Number(form.program_id) : undefined } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);

  const isEditing = !!level;

  useEffect(() => {
    if (level) {
      const specialization = level.specialization || null;
      setForm({
        title: level.title || '',
        description: level.description || '',
        level: level.level != null ? String(level.level) : '',
        specialization_id: level.specialization_id ?? specialization?.id ?? '',
        program_id: specialization?.program?.id ?? '',
        status: typeof level.status === 'number' ? level.status : 1,
      });
    } else {
      setForm({ title: '', description: '', level: '', specialization_id: '', program_id: '', status: 1 });
    }
    setErrors({});
    setFormError('');
  }, [level, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'status' ? Number(value)
        : name === 'program_id' || name === 'specialization_id'
          ? (value ? Number(value) : '')
          : value,
    }));
    if (name === 'program_id') {
      setForm(prev => ({ ...prev, specialization_id: '' }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.specialization_id) next.specialization_id = 'Specialization is required';
    if (form.level && isNaN(Number(form.level))) next.level = 'Level must be a number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: form.title,
      description: form.description || undefined,
      level: form.level ? Number(form.level) : undefined,
      specialization_id: Number(form.specialization_id),
      status: form.status,
      company_id: DEFAULT_COMPANY_ID,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: level.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save level');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Level' : 'Add Level'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program</label>
            <select
              name="program_id"
              value={form.program_id}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialization *</label>
            <select
              name="specialization_id"
              value={form.specialization_id}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.specialization_id ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">Select specialization</option>
              {specializations.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.title}</option>
              ))}
            </select>
            {errors.specialization_id && <p className="mt-1 text-sm text-red-600">{errors.specialization_id}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => {
              setForm(prev => ({ ...prev, description: html }));
            }}
            placeholder="Describe the level..."
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Level number</label>
            <input
              name="level"
              value={form.level}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.level ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default LevelModal;


