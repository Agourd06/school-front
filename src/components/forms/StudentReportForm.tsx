import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
}) => {
  const { t } = useTranslation();
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

  const selectedStudentId = typeof form.student_id === 'number' ? form.student_id : undefined;
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
      e.school_year_period_id = t('forms.periodRequired');
    }
    if (form.student_id === '' || form.student_id === null) {
      e.student_id = t('forms.studentRequired');
    }
    if (form.school_year_id === '' || form.school_year_id === null) {
      e.school_year_id = t('forms.schoolYearRequired');
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
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary space-x-2 flex flex-wrap gap-2">
          {contextInfo.year && <span className="font-semibold">{t('forms.yearLabel')}:</span>}
          {contextInfo.year && <span>{contextInfo.year}</span>}
          {contextInfo.period && (
            <>
              <span className="font-semibold">{t('forms.periodLabel')}:</span>
              <span>{contextInfo.period}</span>
            </>
          )}
          {contextInfo.className && (
            <>
              <span className="font-semibold">{t('forms.classLabel')}:</span>
              <span>{contextInfo.className}</span>
            </>
          )}
        </div>
      )}

      {initialData && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-heading">{t('sections.student')}</label>
            {selectedStudentId && (
              <button
                type="button"
                onClick={() => setStudentDetailsModalOpen(true)}
                className="p-1 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition"
                title={t('forms.viewStudentDetails')}
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
          <SearchSelect
            value={studentValue}
            onChange={handleSelectChange('student_id')}
            options={studentOptions}
            placeholder={t('sections.selectStudent')}
            error={errors.student_id}
            disabled={disableStudentSelect}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SearchSelect
          label={t('sections.period')}
          value={periodValue}
          onChange={handleSelectChange('school_year_period_id')}
          options={periodOptions}
          placeholder={t('sections.selectPeriod')}
          error={errors.school_year_period_id}
          disabled={disablePeriodSelect}
        />
        {!initialData && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-heading">{t('sections.student')}</label>
              {selectedStudentId && (
                <button
                  type="button"
                  onClick={() => setStudentDetailsModalOpen(true)}
                  className="p-1 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition"
                  title={t('forms.viewStudentDetails')}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            <SearchSelect
              value={studentValue}
              onChange={handleSelectChange('student_id')}
              options={studentOptions}
              placeholder={t('sections.selectStudent')}
              error={errors.student_id}
              disabled={disableStudentSelect}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Input
            label={t('forms.mention')}
            value={form.mention}
            onChange={(e) => setForm((prev) => ({ ...prev, mention: e.target.value }))}
            placeholder={t('forms.optionalMention')}
          />
        </div>
        <Select
          label={t('common.status')}
          value={form.status}
          onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportStatus }))}
          options={statusOptionsSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">{t('forms.promotionStatus')}</p>
          <p className="text-sm text-heading" dangerouslySetInnerHTML={{ __html: t('forms.markStudentAsPassed') }} />
        </div>
        <label className="inline-flex items-center gap-3 text-heading font-semibold text-base">
          <input
            type="checkbox"
            checked={form.passed}
            onChange={(e) => setForm((prev) => ({ ...prev, passed: e.target.checked }))}
            className="h-6 w-6 rounded-md border-primary/40 text-primary focus:ring-primary/60"
          />
          <span>{t('forms.passed')}</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-heading mb-2">{t('forms.remarks')}</label>
        <RichTextEditor
          value={form.remarks}
          onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
          placeholder={t('forms.optionalNotesAboutProgress')}
          rows={10}
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? t('forms.updateReport') : t('forms.createReport')}
        </Button>
      </div>
    </form>
    <BaseModal
      isOpen={studentDetailsModalOpen}
      onClose={() => setStudentDetailsModalOpen(false)}
      title={
        student
          ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || t('forms.studentDetails')
          : t('forms.studentDetails')
      }
    >
      {studentDetailsLoading ? (
        <div className="py-8 text-center text-sm text-muted">{t('forms.loadingStudentDetails')}</div>
      ) : (
        <div className="space-y-5">
          {student && (
            <section className="space-y-2">
              <div className="flex items-center gap-3">
                {student.picture && (
                  <img
                    src={getFileUrl(student.picture)}
                    alt={student.first_name ?? student.email ?? t('sidebar.student')}
                    className="h-14 w-14 rounded-full object-cover border"
                  />
                )}
                <div>
                  <p className="text-base font-semibold text-heading">
                    {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `#${student.id}`}
                  </p>
                  <p className="text-sm text-muted">{student.email}</p>
                  {student.phone && <p className="text-sm text-muted">{student.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted uppercase text-xs">{t('forms.nationality')}</p>
                  <p className="text-heading">{student.nationality || '—'}</p>
                </div>
                <div>
                  <p className="text-muted uppercase text-xs">{t('forms.birthday')}</p>
                  <p className="text-heading">{student.birthday || '—'}</p>
                </div>
                <div>
                  <p className="text-muted uppercase text-xs">{t('forms.city')}</p>
                  <p className="text-heading">{student.city || '—'}</p>
                </div>
                <div>
                  <p className="text-muted uppercase text-xs">{t('forms.country')}</p>
                  <p className="text-heading">{student.country || '—'}</p>
                </div>
              </div>
            </section>
          )}

          {diploma && (
            <section className="rounded-2xl border border-border p-4 space-y-4 bg-gradient-to-br from-card to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary">{t('forms.academicRecord')}</p>
                  <h4 className="text-lg font-semibold text-heading mt-1">{diploma.title || t('forms.diploma')}</h4>
                </div>
                <span className="text-xs rounded-full bg-primary/10 px-3 py-0.5 text-primary font-semibold">
                  {diploma.status === 1 ? t('forms.active') : diploma.status === -1 ? t('forms.archived') : t('forms.draft')}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-body">
                  <p>
                    <span className="text-muted">{t('forms.diploma')}:</span> {diploma.diplome || '—'}
                  </p>
                  <p>
                    <span className="text-muted">{t('forms.school')}:</span> {diploma.school || '—'}
                  </p>
                  <p>
                    <span className="text-muted">{t('forms.year')}:</span> {diploma.annee || '—'}
                  </p>
                  <p>
                    <span className="text-muted">{t('common.status')}:</span> {diploma.status ?? '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted">{t('forms.location')}:</span>{' '}
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
                                label: `${diploma.title || t('forms.diploma')} – ${t('forms.picture')} 1`,
                              })
                            }
                            className="w-full"
                          >
                            <img
                              className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                              src={getFileUrl(diploma.diplome_picture_1)}
                              alt={`${t('forms.diploma')} ${t('forms.picture')} 1`}
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
                                label: `${diploma.title || t('forms.diploma')} – ${t('forms.picture')} 2`,
                              })
                            }
                            className="w-full"
                          >
                            <img
                              className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                              src={getFileUrl(diploma.diplome_picture_2)}
                              alt={`${t('forms.diploma')} ${t('forms.picture')} 2`}
                            />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted">
                      {t('forms.noDiplomaImagesUploaded')}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {contact && (
            <section className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-heading">{t('sections.studentContacts')}</h4>
                <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {contact.status === 1 ? t('forms.active') : contact.status === -1 ? t('forms.archived') : t('forms.draft')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-body">
                <p>
                  <span className="text-muted">{t('common.name')}:</span>{' '}
                  {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}
                </p>
                <p>
                  <span className="text-muted">{t('forms.birthday')}:</span> {contact.birthday || '—'}
                  </p>
                <p>
                  <span className="text-muted">{t('forms.email')}:</span> {contact.email || '—'}
                  </p>
                <p>
                  <span className="text-muted">{t('forms.phone')}:</span> {contact.phone || '—'}
                  </p>
                <p>
                  <span className="text-muted">{t('forms.address')}:</span> {contact.adress || '—'}
                  </p>
                <p>
                  <span className="text-muted">{t('forms.city')}:</span> {contact.city || '—'}
                  </p>
                <p>
                  <span className="text-muted">{t('forms.country')}:</span> {contact.country || '—'}
                </p>
              </div>
            </section>
          )}

          {linkType && (
            <section className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-heading">{t('forms.linkType')}</h4>
                <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {linkType.status === 1 ? t('forms.active') : linkType.status === 0 ? t('forms.disabled') : t('forms.draft')}
                </span>
              </div>
              <p className="text-sm text-body">
                <span className="text-muted">{t('common.name')}:</span> {linkType.title || '—'}
              </p>
              {linkType.student_id && (
                <p className="text-xs text-muted">{t('forms.linkedStudentId')}: {linkType.student_id}</p>
              )}
            </section>
          )}

          {!student && !diploma && !contact && (
            <p className="text-sm text-muted">{t('forms.noDetailsAvailable')}</p>
          )}
        </div>
      )}
    </BaseModal>
    <BaseModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.label || t('forms.diplomaPreview')}>
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
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            {t('forms.closePreview')}
          </button>
        </div>
      )}
    </BaseModal>
    </>
  );
};

export default StudentReportForm;

