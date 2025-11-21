import React, { useState, useEffect, useMemo } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { PresenceValue, StudentPresenceStatus } from '../../api/studentPresence';

export interface StudentPresenceFormData {
  student_planning_id: number | '';
  student_id: number | '';
  presence: PresenceValue;
  note: string;
  remarks: string;
  status: StudentPresenceStatus;
}

export interface StudentPresence {
  id: number;
  student_planning_id?: number;
  student_id?: number;
  presence?: PresenceValue;
  note?: number | string;
  remarks?: string;
  status: StudentPresenceStatus;
}

const presenceOptions: Array<{ value: PresenceValue; label: string }> = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const statusOptionsSelect = STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));
const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

interface StudentPresenceFormProps {
  initialData?: StudentPresence | null;
  onSubmit: (data: StudentPresenceFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  planningOptions: SearchSelectOption[];
  studentOptions: SearchSelectOption[];
}

const StudentPresenceForm: React.FC<StudentPresenceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  planningOptions,
  studentOptions,
}) => {
  const [form, setForm] = useState<StudentPresenceFormData>({
    student_planning_id: '',
    student_id: '',
    presence: 'absent',
    note: '-1',
    remarks: '',
    status: 2,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = statusOptionsSelect.some((opt) => opt.value === initialData.status)
        ? initialData.status
        : 2;
      setForm({
        student_planning_id: initialData.student_planning_id ?? '',
        student_id: initialData.student_id ?? '',
        presence: initialData.presence ?? 'absent',
        note: initialData.note !== undefined && initialData.note !== null ? String(initialData.note) : '-1',
        remarks: initialData.remarks ?? '',
        status: normalizedStatus,
      });
    } else {
      setForm({
        student_planning_id: '',
        student_id: '',
        presence: 'absent',
        note: '-1',
        remarks: '',
        status: 2,
      });
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.student_planning_id === '' || form.student_planning_id === null) {
      e.student_planning_id = 'Planning is required';
    }
    if (form.student_id === '' || form.student_id === null) {
      e.student_id = 'Student is required';
    }
    const noteValue = form.note.trim() === '' ? NaN : Number(form.note);
    if (Number.isNaN(noteValue)) {
      e.note = 'Note must be a number';
    }
    if (!statusOptionsSelect.some((opt) => opt.value === form.status)) {
      e.status = 'Invalid status selected';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof StudentPresenceFormData) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      status: Number(event.target.value) as StudentPresenceStatus,
    }));
    if (errors.status) {
      setErrors((prev) => ({ ...prev, status: '' }));
    }
  };

  const handlePresenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      presence: event.target.value as PresenceValue,
    }));
  };

  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^-?\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setForm((prev) => ({ ...prev, note: value }));
      if (errors.note) {
        setErrors((prev) => ({ ...prev, note: '' }));
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const planningValue = useMemo(() => form.student_planning_id ?? '', [form.student_planning_id]);
  const studentValue = useMemo(() => form.student_id ?? '', [form.student_id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SearchSelect
          label="Planning"
          value={planningValue}
          onChange={handleSelectChange('student_planning_id')}
          options={planningOptions}
          placeholder="Select planning"
          error={errors.student_planning_id}
        />
        <SearchSelect
          label="Student"
          value={studentValue}
          onChange={handleSelectChange('student_id')}
          options={studentOptions}
          placeholder="Select student"
          error={errors.student_id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Presence"
          value={form.presence}
          onChange={handlePresenceChange}
          options={presenceOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Input
          label="Note"
          type="text"
          value={form.note}
          onChange={handleNoteChange}
          placeholder="Enter note (e.g., 15.5)"
          error={errors.note}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
        <RichTextEditor
          value={form.remarks}
          onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
          placeholder="Optional remarks"
          rows={6}
        />
      </div>

      <Select
        label="Status"
        value={form.status}
        onChange={handleStatusChange}
        options={statusOptionsFormSelect.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        error={errors.status}
        className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Presence' : 'Create Presence'}
        </Button>
      </div>
    </form>
  );
};

export default StudentPresenceForm;

