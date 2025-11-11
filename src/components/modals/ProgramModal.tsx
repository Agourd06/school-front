import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateProgram, useUpdateProgram } from '../../hooks/usePrograms';
import { STATUS_OPTIONS_FORM, DEFAULT_COMPANY_ID } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program?: any | null;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, program }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  const isEditing = !!program;

  useEffect(() => {
    if (program) {
      setForm({
        title: program.title || '',
        description: program.description || '',
        status: typeof program.status === 'number' ? program.status : 1,
      });
    } else {
      setForm({ title: '', description: '', status: 1 });
    }
    setErrors({});
    setFormError('');
  }, [program, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: program.id, data: { ...form, company_id: DEFAULT_COMPANY_ID } });
      } else {
        await createMutation.mutateAsync({ ...form, company_id: DEFAULT_COMPANY_ID });
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save program');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Program' : 'Add Program'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}
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
            onChange={(html) => setForm(prev => ({ ...prev, description: html }))}
            placeholder="Describe the program..."
            rows={6}
          />
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

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ProgramModal;


