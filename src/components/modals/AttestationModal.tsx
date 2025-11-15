import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateAttestation, useUpdateAttestation } from '../../hooks/useAttestations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import type { Attestation } from '../../api/attestation';

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attestation?: Attestation | null;
}

const AttestationModal: React.FC<AttestationModalProps> = ({ isOpen, onClose, attestation }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    statut: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const createMutation = useCreateAttestation();
  const updateMutation = useUpdateAttestation();

  const isEditing = !!attestation;

  useEffect(() => {
    if (attestation) {
      setForm({
        title: attestation.title || '',
        description: attestation.description || '',
        statut: typeof attestation.statut === 'number' ? attestation.statut : 1,
      });
    } else {
      setForm({ title: '', description: '', statut: 1 });
    }
    setErrors({});
    setFormError('');
  }, [attestation, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({ 
      ...prev, 
      [name]: name === 'statut' ? Number(value) : value 
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDescriptionChange = (html: string) => {
    setForm(prev => ({ ...prev, description: html }));
    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: form.title,
      description: form.description || undefined,
      statut: form.statut,
      // companyid is automatically set by the API from authenticated user
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: attestation.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setFormError(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        setFormError(errorMessage);
      } else {
        setFormError(err?.message || 'Failed to save attestation');
      }
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Attestation' : 'Add Attestation'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="statut"
            value={form.statut}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {STATUS_OPTIONS_FORM.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <RichTextEditor
              value={form.description}
              onChange={handleDescriptionChange}
              placeholder="Enter description..."
              rows={6}
            />
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

export default AttestationModal;

