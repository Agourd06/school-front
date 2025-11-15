import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentLinkType, useUpdateStudentLinkType } from '../../hooks/useStudentLinkTypes';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: any | null;
}

const StudentLinkTypeModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [error, setError] = useState('');

  const createMut = useCreateStudentLinkType();
  const updateMut = useUpdateStudentLinkType();

  const isEditing = !!item;

  useEffect(() => {
    setTitle(item?.title || '');
    setStatus(typeof item?.status === 'number' ? item.status : 1);
    setError('');
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      // company_id is automatically set by the API from authenticated user
      const base = { title, status } as any;
      if (isEditing) await updateMut.mutateAsync({ id: item.id, data: base });
      else await createMut.mutateAsync(base);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Link Type' : 'Add Link Type'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Parent, Guardian, etc."
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            {STATUS_OPTIONS_FORM.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentLinkTypeModal;


