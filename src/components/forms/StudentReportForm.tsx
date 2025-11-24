import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import { Eye } from 'lucide-react';
import type { StudentReportStatus } from '../../api/studentReport';
import { studentsApi } from '../../api/students';
import type { Student as ApiStudent } from '../../api/students';
import { getFileUrl } from '../../utils/apiConfig';
import BaseModal from '../modals/BaseModal';

export interface StudentReportFormData {
  school_year_id: number | '';
  school_year_period_id: number | '';
  student_id: number | '';
  remarks: string;
  mention: string;
  passed: boolean;
  status: StudentReportStatus;
}

export interface StudentReport {
  id: number;
  school_year_id?: number;
  school_year_period_id?: number;
  student_id?: number;
  remarks?: string;
  mention?: string;
  passed?: boolean;
  status: StudentReportStatus;
}

const statusOptionsSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

interface StudentReportFormProps {
  initialData?: StudentReport | null;
  onSubmit: (data: StudentReportFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  periodOptions: SearchSelectOption[];
  studentOptions: SearchSelectOption[];
  presetValues?: Partial<StudentReportFormData>;
  contextInfo?: {
    year?: string;
    period?: string;
    className?: string;
  };
  disableStudentSelect?: boolean;
  disablePeriodSelect?: boolean;
  onViewReportDetails?: (studentId: number) => void;
}

const StudentReportForm: React.FC<StudentReportFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  periodOptions,
  studentOptions,
  presetValues,
  contextInfo,
  disableStudentSelect = false,
  disablePeriodSelect = false,
  onViewReportDetails,
}) => {
  const [form, setForm] = useState<StudentReportFormData>({
    school_year_id: '',
    school_year_period_id: '',
    student_id: '',
    remarks: '',
    mention: '',
    passed: false,
    status: 2,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const [studentDetailsModalOpen, setStudentDetailsModalOpen] = useState(false);

  const selectedStudentId = form.student_id && form.student_id !== '' ? Number(form.student_id) : undefined;
  const { data: studentDetailsData, isLoading: studentDetailsLoading } = useQuery({
    queryKey: ['studentDetails', selectedStudentId],
    queryFn: () => studentsApi.getDetails(selectedStudentId!),
    enabled: Boolean(selectedStudentId),
    staleTime: 60_000,
  });

  const student = studentDetailsData?.student as ApiStudent | undefined;
  const diploma = studentDetailsData?.diploma;
  const contact = studentDetailsData?.contact;
  const linkType = studentDetailsData?.linkType ?? contact?.studentLinkType;

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = statusOptionsSelect.some((opt) => opt.value === initialData.status)
        ? initialData.status
        : 2;
      setForm({
        school_year_period_id: initialData.school_year_period_id ?? '',
        student_id: initialData.student_id ?? '',
        school_year_id: initialData.school_year_id ?? '',
        remarks: initialData.remarks ?? '',
        mention: initialData.mention ?? '',
        passed: !!initialData.passed,
        status: normalizedStatus,
      });
    } else {
      setForm({
        school_year_id: '',
        school_year_period_id: '',
        student_id: '',
        remarks: '',
        mention: '',
        passed: false,
        status: 2,
        ...presetValues,
      });
    }
    setErrors({});
  }, [initialData, presetValues]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.school_year_period_id === '' || form.school_year_period_id === null) {
      e.school_year_period_id = 'Period is required';
    }
    if (form.student_id === '' || form.student_id === null) {
      e.student_id = 'Student is required';
    }
    if (form.school_year_id === '' || form.school_year_id === null) {
      e.school_year_id = 'School year is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof StudentReportFormData) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const periodValue = useMemo(() => form.school_year_period_id ?? '', [form.school_year_period_id]);
  const studentValue = useMemo(() => form.student_id ?? '', [form.student_id]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {contextInfo && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700 space-x-2 flex flex-wrap gap-2">
          {contextInfo.year && <span className="font-semibold">Year:</span>}
          {contextInfo.year && <span>{contextInfo.year}</span>}
          {contextInfo.period && (
            <>
              <span className="font-semibold">Period:</span>
              <span>{contextInfo.period}</span>
            </>
          )}
          {contextInfo.className && (
            <>
              <span className="font-semibold">Class:</span>
              <span>{contextInfo.className}</span>
            </>
          )}
        </div>
      )}

      {initialData && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-700">Student</label>
            {selectedStudentId && (
              <button
                type="button"
                onClick={() => setStudentDetailsModalOpen(true)}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                title="View student details"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
          <SearchSelect
            value={studentValue}
            onChange={handleSelectChange('student_id')}
            options={studentOptions}
            placeholder="Select student"
            error={errors.student_id}
            disabled={disableStudentSelect}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SearchSelect
          label="Period"
          value={periodValue}
          onChange={handleSelectChange('school_year_period_id')}
          options={periodOptions}
          placeholder="Select period"
          error={errors.school_year_period_id}
          disabled={disablePeriodSelect}
        />
        {!initialData && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">Student</label>
              {selectedStudentId && (
                <button
                  type="button"
                  onClick={() => setStudentDetailsModalOpen(true)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                  title="View student details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            <SearchSelect
              value={studentValue}
              onChange={handleSelectChange('student_id')}
              options={studentOptions}
              placeholder="Select student"
              error={errors.student_id}
              disabled={disableStudentSelect}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Input
            label="Mention"
            value={form.mention}
            onChange={(e) => setForm((prev) => ({ ...prev, mention: e.target.value }))}
            placeholder="Optional mention (e.g. Très Bien)"
            className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportStatus }))}
          options={statusOptionsSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
        <RichTextEditor
          value={form.remarks}
          onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
          placeholder="Optional notes about the student's progress"
          rows={10}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.passed}
            onChange={(e) => setForm((prev) => ({ ...prev, passed: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Passed
        </label>
      </div>

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
          {initialData ? 'Update Report' : 'Create Report'}
        </Button>
      </div>
    </form>
    <BaseModal
      isOpen={studentDetailsModalOpen}
      onClose={() => setStudentDetailsModalOpen(false)}
      title={
        student
          ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || 'Student details'
          : 'Student details'
      }
    >
      {studentDetailsLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading student details…</div>
      ) : (
        <div className="space-y-5">
          {student && (
            <section className="space-y-2">
              <div className="flex items-center gap-3">
                {student.picture && (
                  <img
                    src={getFileUrl(student.picture)}
                    alt={student.first_name ?? student.email ?? 'student'}
                    className="h-14 w-14 rounded-full object-cover border"
                  />
                )}
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `#${student.id}`}
                  </p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 uppercase text-xs">Nationality</p>
                  <p className="text-gray-900">{student.nationality || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase text-xs">Birthday</p>
                  <p className="text-gray-900">{student.birthday || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase text-xs">City</p>
                  <p className="text-gray-900">{student.city || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase text-xs">Country</p>
                  <p className="text-gray-900">{student.country || '—'}</p>
                </div>
              </div>
            </section>
          )}

          {diploma && (
            <section className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gradient-to-br from-white to-blue-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-500">Academic Record</p>
                  <h4 className="text-lg font-semibold text-gray-900 mt-1">{diploma.title || 'Diploma'}</h4>
                </div>
                <span className="text-xs rounded-full bg-blue-100 px-3 py-0.5 text-blue-700 font-semibold">
                  {diploma.status === 1 ? 'Active' : diploma.status === -1 ? 'Archived' : 'Draft'}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                  <p>
                    <span className="text-gray-500">Diploma:</span> {diploma.diplome || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">School:</span> {diploma.school || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Year:</span> {diploma.annee || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span> {diploma.status ?? '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-gray-500">Location:</span>{' '}
                    {[diploma.city, diploma.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div className="space-y-3">
                  {diploma.diplome_picture_1 || diploma.diplome_picture_2 ? (
                    <>
                      {diploma.diplome_picture_1 && (
                        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setPreview({
                                src: getFileUrl(diploma.diplome_picture_1!),
                                label: `${diploma.title || 'Diploma'} – picture 1`,
                              })
                            }
                            className="w-full"
                          >
                            <img
                              className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                              src={getFileUrl(diploma.diplome_picture_1)}
                              alt="Diploma picture 1"
                            />
                          </button>
                        </div>
                      )}
                      {diploma.diplome_picture_2 && (
                        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setPreview({
                                src: getFileUrl(diploma.diplome_picture_2!),
                                label: `${diploma.title || 'Diploma'} – picture 2`,
                              })
                            }
                            className="w-full"
                          >
                            <img
                              className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                              src={getFileUrl(diploma.diplome_picture_2)}
                              alt="Diploma picture 2"
                            />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500">
                      No diploma images uploaded.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {contact && (
            <section className="rounded-lg border border-gray-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
                <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                  {contact.status === 1 ? 'Active' : contact.status === -1 ? 'Archived' : 'Draft'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                <p>
                  <span className="text-gray-500">Name:</span>{' '}
                  {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Birthday:</span> {contact.birthday || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Email:</span> {contact.email || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span> {contact.phone || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Address:</span> {contact.adress || '—'}
                </p>
                <p>
                  <span className="text-gray-500">City:</span> {contact.city || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Country:</span> {contact.country || '—'}
                </p>
              </div>
            </section>
          )}

          {linkType && (
            <section className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Link Type</h4>
                <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                  {linkType.status === 1 ? 'Active' : linkType.status === 0 ? 'Disabled' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">Title:</span> {linkType.title || '—'}
              </p>
              {linkType.student_id && (
                <p className="text-xs text-gray-500">Linked student ID: {linkType.student_id}</p>
              )}
            </section>
          )}

          {!student && !diploma && !contact && (
            <p className="text-sm text-gray-500">No details available for this student.</p>
          )}
        </div>
      )}
    </BaseModal>
    <BaseModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.label || 'Diploma preview'}>
      {preview && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={preview.src}
            alt={preview.label}
            className="max-h-[70vh] w-full object-contain rounded-2xl border bg-white"
          />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Close Preview
          </button>
        </div>
      )}
    </BaseModal>
    </>
  );
};

export default StudentReportForm;

