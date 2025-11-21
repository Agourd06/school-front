import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import type { PresenceValue, StudentPresence, StudentPresenceStatus } from '../../api/studentPresence';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import { Button } from '../ui';

export interface StudentPresenceFormValues {
  student_planning_id: number | '';
  student_id: number | '';
  presence: PresenceValue;
  note: string;
  remarks: string;
  // company_id is automatically set by the API from authenticated user
  status: StudentPresenceStatus;
}

interface StudentPresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentPresence | null;
  onSubmit: (values: StudentPresenceFormValues) => Promise<void>;
  isSubmitting?: boolean;
  planningOptions: SearchSelectOption[];
  studentOptions: SearchSelectOption[];
  // companyOptions removed - company is auto-set from authenticated user
  serverError?: string | null;
}

const DEFAULT_FORM: StudentPresenceFormValues = {
  student_planning_id: '',
  student_id: '',
  presence: 'absent',
  note: '-1',
  remarks: '',
  status: 2,
};

const presenceOptions: Array<{ value: PresenceValue; label: string }> = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const statusOptionsSelect = STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));
const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

const StudentPresenceModal: React.FC<StudentPresenceModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  planningOptions,
  studentOptions,
  // companyOptions removed - company is auto-set from authenticated user
  serverError,
}) => {
  const [form, setForm] = useState<StudentPresenceFormValues>(DEFAULT_FORM);
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
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [initialData, isOpen]);

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

  const handleSelectChange = (field: keyof StudentPresenceFormValues) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  // handleCompanyChange removed - company is auto-set from authenticated user

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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Presence' : 'Add Student Presence'}
      className="sm:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SearchSelect
            label="Student Planning"
            value={planningValue}
            onChange={handleSelectChange('student_planning_id')}
            options={planningOptions}
            placeholder="Select planning slot"
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Presence</label>
            <select
              value={form.presence}
              onChange={handlePresenceChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {presenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <input
              type="number"
              // min={-1}
              max={20}
              step={0.5}
              value={form.note}
              onChange={handleNoteChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note (-1 to 20)"
            />
            <p className="mt-1 text-xs text-gray-500">Use -1 to indicate that the note is not set.</p>
            {errors.note && <p className="mt-1 text-sm text-red-600">{errors.note}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={handleStatusChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptionsFormSelect.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <RichTextEditor
            value={form.remarks}
            onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
            placeholder="Optional notes about the student's presence"
            rows={10}
          />
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {initialData ? 'Update Presence' : 'Create Presence'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentPresenceModal;

