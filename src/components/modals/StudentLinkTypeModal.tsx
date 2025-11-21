import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentLinkType, useUpdateStudentLinkType } from '../../hooks/useStudentLinkTypes';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

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
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Parent, Guardian, etc."
          error={error}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(Number(e.target.value))}
          options={STATUS_OPTIONS_FORM.map(opt => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentLinkTypeModal;


