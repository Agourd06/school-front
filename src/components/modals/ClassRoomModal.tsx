import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateClassRoom, useUpdateClassRoom } from '../../hooks/useClassRooms';
import { validateRequired, validatePositiveNumber } from './validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

interface ClassRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRoom?: any | null;
}

const ClassRoomModal: React.FC<ClassRoomModalProps> = ({ isOpen, onClose, classRoom }) => {
  const [form, setForm] = useState({ code: '', title: '', capacity: '', status: 1 as number });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateClassRoom();
  const updateMutation = useUpdateClassRoom();

  const isEditing = !!classRoom;

  useEffect(() => {
    if (classRoom) {
      setForm({
        code: classRoom.code || '',
        title: classRoom.title || '',
        capacity: classRoom.capacity != null ? String(classRoom.capacity) : '',
        status: typeof classRoom.status === 'number' ? classRoom.status : 1,
      });
    } else {
      setForm({ code: '', title: '', capacity: '', status: 1 });
    }
    setErrors({});
  }, [classRoom, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'status'
        ? Number(value)
        : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const codeErr = validateRequired(form.code, 'Code');
    if (codeErr) newErrors.code = codeErr;
    const titleErr = validateRequired(form.title, 'Title');
    if (titleErr) newErrors.title = titleErr;
    const capErr = validatePositiveNumber(form.capacity, 'Capacity');
    if (capErr) newErrors.capacity = capErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      code: form.code,
      title: form.title,
      capacity: Number(form.capacity || 0),
      // company_id is automatically set by the API from authenticated user
      status: Number(form.status),
    };

    if (isEditing && classRoom?.id) {
      await updateMutation.mutateAsync({ id: classRoom.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Classroom' : 'Add Classroom'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.code ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
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
          <label className="block text-sm font-medium text-gray-700">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClassRoomModal;


