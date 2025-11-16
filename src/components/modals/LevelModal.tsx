import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateLevel, useUpdateLevel } from '../../hooks/useLevels';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations, useSpecialization as useSpecializationById } from '../../hooks/useSpecializations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  level?: any | null;
  initialSpecializationId?: number;
}

const LevelModal: React.FC<LevelModalProps> = ({ isOpen, onClose, level, initialSpecializationId }) => {
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

  // When editing, use the level's specialization ID; when creating, use initialSpecializationId
  const specializationIdForFetch = level 
    ? (level.specialization_id || level.specialization?.id || 0)
    : (initialSpecializationId || 0);
  const { data: selectedSpecialization } = useSpecializationById(specializationIdForFetch);
  
  // Get program data: when editing, use embedded data from level; when creating, use selectedSpecialization's program
  const programFromLevel = level?.specialization?.program;
  const programFromSpecialization = selectedSpecialization?.program;
  const programIdForLookup = level
    ? (level.specialization?.program?.id || level.specialization?.program_id)
    : (selectedSpecialization?.program_id);
  const fetchedProgram = useMemo(() => {
    // When editing, prefer embedded program data from level
    if (programFromLevel) return programFromLevel;
    // When creating, use program from selectedSpecialization
    if (programFromSpecialization) return programFromSpecialization;
    // Fallback: find program from programs list
    if (programIdForLookup) {
      return programs.find((p: any) => p.id === programIdForLookup);
    }
    return null;
  }, [programFromLevel, programFromSpecialization, programIdForLookup, programs]);

  const { data: specializationsResp } = useSpecializations({ 
    page: 1, 
    limit: 100, 
    program_id: form.program_id ? Number(form.program_id) : (selectedSpecialization?.program_id ? selectedSpecialization.program_id : undefined)
  } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);

  const isEditing = !!level;
  // Lock program and specialization when editing (level exists) or when creating with initialSpecializationId
  const isProgramLocked = !!level || !!initialSpecializationId;
  const isSpecializationLocked = !!level || !!initialSpecializationId;

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
      setForm({ 
        title: '', 
        description: '', 
        level: '', 
        specialization_id: initialSpecializationId ?? '', 
        program_id: selectedSpecialization?.program_id ?? '', 
        status: 1 
      });
    }
    setErrors({});
    setFormError('');
  }, [level, isOpen, initialSpecializationId, selectedSpecialization]);

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
    // Save HTML as-is so it can be displayed with formatting
    const descriptionToSave = form.description.trim() || undefined;
    const payload = {
      title: form.title,
      description: descriptionToSave,
      level: form.level ? Number(form.level) : undefined,
      specialization_id: Number(form.specialization_id),
      status: form.status,
      // company_id is automatically set by the API from authenticated user
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

        {/* Program and Specialization - moved to top */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Program & Specialization *</label>
          {isProgramLocked && fetchedProgram && (selectedSpecialization || level?.specialization) ? (
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                <div className="text-xs font-medium text-gray-500 mb-1">Program</div>
                <div className="text-sm font-medium text-gray-900">
                  {fetchedProgram?.title || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                <div className="text-xs font-medium text-gray-500 mb-1">Specialization</div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedSpecialization?.title || level?.specialization?.title || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                <select
                  name="program_id"
                  value={form.program_id}
                  onChange={handleChange}
                  disabled={isProgramLocked}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isProgramLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">All programs</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label>
                <select
                  name="specialization_id"
                  value={form.specialization_id}
                  onChange={handleChange}
                  disabled={isSpecializationLocked}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.specialization_id ? 'border-red-300' : 'border-gray-300'
                  } ${isSpecializationLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select specialization</option>
                  {specializations.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {errors.specialization_id && <p className="mt-1 text-sm text-red-600">{errors.specialization_id}</p>}
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
              {STATUS_OPTIONS_FORM.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default LevelModal;


