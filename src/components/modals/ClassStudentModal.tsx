import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useCompanies } from '../../hooks/useCompanies';
import {
  useCreateClassStudent,
  useUpdateClassStudent,
} from '../../hooks/useClassStudents';
import { STATUS_OPTIONS_FORM, DEFAULT_COMPANY_ID } from '../../constants/status';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import type { ClassStudentAssignment } from '../../api/classStudent';
import RichTextEditor from '../RichTextEditor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assignment?: ClassStudentAssignment | null;
}

type FormState = {
  title: string;
  description: string;
  class_id: number | '';
  student_id: number | '';
  company_id: number | '';
  status: number;
  tri: number | '';
};

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  class_id: '',
  student_id: '',
  company_id: DEFAULT_COMPANY_ID,
  status: 1,
  tri: 1,
};

const ClassStudentModal: React.FC<Props> = ({ isOpen, onClose, assignment }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMut = useCreateClassStudent();
  const updateMut = useUpdateClassStudent();

  const { data: classesResp, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 } as any);
  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: 100 } as any);
  const { data: companiesResp, isLoading: companiesLoading } = useCompanies({ page: 1, limit: 100 } as any);

  const classOptions: SearchSelectOption[] = useMemo(
    () =>
      (((classesResp as any)?.data) || [])
        .filter((cls: any) => cls?.status !== -2)
        .map((cls: any) => ({
          value: cls.id,
          label: cls.title || `Class #${cls.id}`,
        })),
    [classesResp]
  );

  const studentOptions: SearchSelectOption[] = useMemo(
    () =>
      (((studentsResp as any)?.data) || [])
        .filter((stu: any) => stu?.status !== -2)
        .map((stu: any) => {
          const fullName = `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim();
          return {
            value: stu.id,
            label: fullName || stu.email || `Student #${stu.id}`,
          };
        }),
    [studentsResp]
  );

  const companyOptions: SearchSelectOption[] = useMemo(
    () =>
      (((companiesResp as any)?.data) || [])
        .filter((company: any) => company?.status !== -2)
        .map((company: any) => ({
          value: company.id,
          label: company.title || company.name || `Company #${company.id}`,
        })),
    [companiesResp]
  );

  const isEditing = !!assignment;

  useEffect(() => {
    if (assignment) {
      setForm({
        title: assignment.title ?? '',
        description: assignment.description ?? '',
        class_id: assignment.class_id ?? '',
        student_id: assignment.student_id ?? '',
        company_id: assignment.company_id ?? DEFAULT_COMPANY_ID,
        status: typeof assignment.status === 'number' ? assignment.status : 1,
        tri: assignment.tri ?? 1,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [assignment, isOpen]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (form.class_id === '' || Number(form.class_id) <= 0) nextErrors.class_id = 'Class is required';
    if (form.student_id === '' || Number(form.student_id) <= 0) nextErrors.student_id = 'Student is required';
    if (form.tri === '' || Number(form.tri) < 1) nextErrors.tri = 'Tri must be at least 1';
    return nextErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : name === 'tri' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: keyof FormState) => (val: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [name]: val === '' ? '' : Number(val),
    }));
    if (errors[name as string]) setErrors((prev) => ({ ...prev, [name as string]: '' }));
  };

  const handleDescriptionChange = (content: string) => {
    setForm((prev) => ({
      ...prev,
      description: content,
    }));
    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      class_id: Number(form.class_id),
      student_id: Number(form.student_id),
      company_id: form.company_id === '' ? undefined : Number(form.company_id),
      status: form.status,
      tri: form.tri === '' ? 1 : Number(form.tri),
    };

    try {
      if (isEditing && assignment) {
        const updatePayload: Record<string, any> = {
          title: basePayload.title,
          description: basePayload.description,
          class_id: basePayload.class_id,
          status: basePayload.status,
          tri: basePayload.tri,
          company_id: basePayload.company_id,
        };

        if (assignment.student_id !== basePayload.student_id) {
          updatePayload.student_id = basePayload.student_id;
        }

        await updateMut.mutateAsync({ id: assignment.id, data: updatePayload });
      } else {
        await createMut.mutateAsync(basePayload);
      }

      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save assignment';
      setErrors((prev) => ({ ...prev, form: message }));
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Assignment' : 'Add Assignment'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && <div className="text-sm text-red-600">{errors.form}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {STATUS_OPTIONS_FORM.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchSelect
            label="Class"
            value={form.class_id}
            onChange={handleSelectChange('class_id')}
            options={classOptions}
            placeholder="Select class"
            isLoading={classesLoading}
            error={errors.class_id}
          />

          <SearchSelect
            label="Student"
            value={form.student_id}
            onChange={handleSelectChange('student_id')}
            options={studentOptions}
            placeholder="Select student"
            isLoading={studentsLoading}
            error={errors.student_id}
            disabled={isEditing}
          />
        </div>
        {isEditing && (
          <p className="text-xs text-gray-500">Student cannot be changed when editing an assignment.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchSelect
            label="Company"
            value={form.company_id ?? ''}
            onChange={handleSelectChange('company_id')}
            options={companyOptions}
            placeholder="Select company"
            isLoading={companiesLoading}
            isClearable
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Tri</label>
            <input
              type="number"
              name="tri"
              value={form.tri === '' ? '' : form.tri}
              onChange={handleInputChange}
              min={1}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.tri && <p className="text-sm text-red-600">{errors.tri}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            value={form.description}
            onChange={handleDescriptionChange}
            placeholder="Describe the assignment..."
            rows={6}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClassStudentModal;


