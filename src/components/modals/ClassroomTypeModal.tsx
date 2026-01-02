import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Input, Select, Button } from '../ui';
import { useCreateClassroomType, useUpdateClassroomType } from '../../hooks/useClassroomTypes';
import type { ClassroomType } from '../../api/classroomType';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

interface ClassroomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ClassroomType;
}

const ClassroomTypeModal: React.FC<ClassroomTypeModalProps> = ({ isOpen, onClose, item }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [status, setStatus] = useState<number>(item?.status ?? 1);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateClassroomType();
  const updateMutation = useUpdateClassroomType();

  React.useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setStatus(item.status ?? 1);
    } else {
      setTitle('');
      setStatus(1);
    }
    setError(null);
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      if (item?.id) {
        await updateMutation.mutateAsync({
          id: item.id,
          data: { title: title.trim(), status },
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          status,
        });
      }
      onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      if (Array.isArray(dataMessage)) {
        setError(dataMessage.join(', '));
      } else if (typeof dataMessage === 'string') {
        setError(dataMessage);
      } else if (typeof axiosError.message === 'string') {
        setError(axiosError.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Classroom Type' : 'Create Classroom Type'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
            {error}
          </div>
        )}

        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          error={error && !title.trim() ? error : undefined}
          required
        />

        <Select
          label="Status"
          name="status"
          value={status}
          onChange={(e) => setStatus(Number(e.target.value))}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={createMutation.isPending || updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
            {item ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClassroomTypeModal;

