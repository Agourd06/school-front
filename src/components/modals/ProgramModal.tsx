import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateProgram, useUpdateProgram } from '../../hooks/usePrograms';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';

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
      // Save HTML as-is so it can be displayed with formatting
      const descriptionToSave = form.description.trim() || undefined;
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: program.id,
          data: {
            title: form.title.trim(),
            description: descriptionToSave,
            status: form.status,
            // company_id is automatically set by the API from authenticated user
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: form.title.trim(),
          description: descriptionToSave,
          status: form.status,
          // company_id is automatically set by the API from authenticated user
        });
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
            onChange={(html) => setForm(prev => ({ ...prev, description: html }))}
            placeholder="Describe the program..."
            rows={6}
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

export default ProgramModal;


