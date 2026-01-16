import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { ClassCourse, ClassCourseStatus } from '../../api/classCourse';
import { useModuleCourses } from '../../hooks/useModules';

export interface ClassCourseFormData {
  title: string;
  description: string;
  status: ClassCourseStatus;
  class_id: number | '';
  module_id: number | '';
  course_id: number | '';
  teacher_id: number | '';
  volume: string;
  weeklyFrequency: string;
  allday: boolean;
  duration: string;
}

interface ClassCourseFormProps {
  initialData?: ClassCourse | null;
  onSubmit: (data: ClassCourseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  classOptions: SearchSelectOption[];
  moduleOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  teacherOptions: SearchSelectOption[];
}

const statusOptionsSelect = STATUS_OPTIONS_FORM.map((option) => ({
  value: option.value,
  label: option.label,
}));

const allowedStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

const ClassCourseForm: React.FC<ClassCourseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  classOptions,
  moduleOptions,
  courseOptions,
  teacherOptions,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ClassCourseFormData>({
    title: '',
    description: '',
    status: 1,
    class_id: '',
    module_id: '',
    course_id: '',
    teacher_id: '',
    volume: '',
    weeklyFrequency: '1',
    allday: false,
    duration: '2',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVolumeManual, setIsVolumeManual] = useState(false);
  const selectedModuleId = form.module_id ? Number(form.module_id) : undefined;
  const { data: moduleCourses = [], isLoading: moduleCoursesLoading } = useModuleCourses(selectedModuleId);

  // Calculate volume automatically based on duration and weekly frequency
  useEffect(() => {
    if (!isVolumeManual) {
      const durationNum = Number(form.duration);
      
      if (!Number.isNaN(durationNum) && durationNum > 0) {
        let calculatedVolume = 0;
        
        if (form.allday) {
          // All week: 5 days × duration
          calculatedVolume = 5 * durationNum;
        } else {
          const frequencyNum = Number(form.weeklyFrequency);
          if (!Number.isNaN(frequencyNum) && frequencyNum > 0) {
            // Weekly frequency × duration
            calculatedVolume = frequencyNum * durationNum;
          }
        }
        
        if (calculatedVolume > 0) {
          setForm((prev) => ({
            ...prev,
            volume: String(calculatedVolume),
          }));
        } else if (calculatedVolume === 0 && form.volume) {
          // Clear volume if calculation results in 0
          setForm((prev) => ({
            ...prev,
            volume: '',
          }));
        }
      }
    }
  }, [form.duration, form.weeklyFrequency, form.allday, isVolumeManual]);

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = allowedStatusValues.has(initialData.status) ? initialData.status : 1;
      setForm({
        title: initialData.title ?? '',
        description: initialData.description ?? '',
        status: normalizedStatus,
        class_id: initialData.class_id ?? '',
        module_id: initialData.module_id ?? '',
        course_id: initialData.course_id ?? '',
        teacher_id: initialData.teacher_id ?? '',
        volume: initialData.volume !== undefined && initialData.volume !== null ? String(initialData.volume) : '',
        weeklyFrequency:
          initialData.weeklyFrequency !== undefined && initialData.weeklyFrequency !== null
            ? String(initialData.weeklyFrequency)
            : '1',
        allday: Boolean(initialData.allday),
        duration:
          initialData.duration !== undefined && initialData.duration !== null ? String(initialData.duration) : '2',
      });
      // If editing, volume is already set, so mark as manual
      setIsVolumeManual(true);
    } else {
      setForm({
        title: '',
        description: '',
        status: 1,
        class_id: '',
        module_id: '',
        course_id: '',
        teacher_id: '',
        volume: '',
        weeklyFrequency: '1',
        allday: false,
        duration: '2',
      });
      setIsVolumeManual(false);
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const validationErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      validationErrors.title = t('forms.titleRequired');
    }
    if (form.class_id === '' || form.class_id === null) {
      validationErrors.class_id = t('forms.classRequired');
    }
    if (form.module_id === '' || form.module_id === null) {
      validationErrors.module_id = t('forms.moduleRequired');
    }
    if (form.course_id === '' || form.course_id === null) {
      validationErrors.course_id = t('forms.courseRequired');
    }
    if (form.teacher_id === '' || form.teacher_id === null) {
      validationErrors.teacher_id = t('forms.teacherRequired');
    }

    if (form.volume.trim()) {
      const volumeValue = Number(form.volume);
      if (Number.isNaN(volumeValue) || volumeValue < 0) {
        validationErrors.volume = t('forms.volumeMustBeZeroOrGreater');
      }
    }

    if (!form.allday) {
      const frequencyValue = Number(form.weeklyFrequency);
      if (Number.isNaN(frequencyValue) || frequencyValue < 1) {
        validationErrors.weeklyFrequency = t('forms.weeklyFrequencyMin');
      }
    }

    const durationValue = Number(form.duration);
    if (Number.isNaN(durationValue) || durationValue < 1) {
      validationErrors.duration = t('forms.durationMin');
    }

    if (!allowedStatusValues.has(form.status)) {
      validationErrors.status = t('forms.invalidStatus');
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSelectChange = (field: keyof Pick<ClassCourseFormData, 'class_id' | 'module_id' | 'course_id' | 'teacher_id'>) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputChange =
    (field: keyof ClassCourseFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value, type, checked } = event.target as HTMLInputElement;
      setForm((prev) => {
        if (field === 'allday') {
          const nextAllDay = Boolean(checked);
          return {
            ...prev,
            allday: nextAllDay,
            weeklyFrequency: nextAllDay ? '' : prev.weeklyFrequency || '1',
          };
        }
        if (field === 'volume') {
          // When user manually edits volume, mark it as manual
          setIsVolumeManual(true);
        }
        return {
          ...prev,
          [field]: type === 'checkbox' ? checked : value,
        };
      });
      if (errors[field as string]) {
        setErrors((prev) => ({ ...prev, [field as string]: '' }));
      }
    };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      status: Number(event.target.value) as ClassCourseStatus,
    }));
    if (errors.status) {
      setErrors((prev) => ({ ...prev, status: '' }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      description: value,
    }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: '' }));
    }
  };

  const moduleCourseOptions = useMemo<SearchSelectOption[]>(() => {
    if (moduleCourses.length > 0) {
      return moduleCourses.map((course) => ({
        value: course.id,
        label: course.title || `${t('forms.courseNumber')}${course.id}`,
        data: course,
      }));
    }
    return courseOptions;
  }, [moduleCourses, courseOptions]);

  const handleCourseChange = (value: number | '' | string) => {
    handleSelectChange('course_id')(value);
    // Volume is automatically calculated based on duration and weekly frequency
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const classValue = useMemo(() => form.class_id ?? '', [form.class_id]);
  const moduleValue = useMemo(() => form.module_id ?? '', [form.module_id]);
  const courseValue = useMemo(() => form.course_id ?? '', [form.course_id]);
  const teacherValue = useMemo(() => form.teacher_id ?? '', [form.teacher_id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">{serverError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('common.name')}
          name="title"
          value={form.title}
          onChange={handleInputChange('title')}
          placeholder={t('forms.enterCourseTitle')}
          error={errors.title}
        />
        <SearchSelect
          label={t('sidebar.classes')}
          value={classValue}
          onChange={handleSelectChange('class_id')}
          options={classOptions}
          placeholder={t('forms.selectClass')}
          error={errors.class_id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchSelect
          label={t('sidebar.modules')}
          value={moduleValue}
          onChange={(value) => {
            handleSelectChange('module_id')(value);
            setForm((prev) => ({
              ...prev,
              course_id: '',
              volume: '',
            }));
          }}
          options={moduleOptions}
          placeholder={t('forms.selectModule')}
          error={errors.module_id}
        />
        <SearchSelect
          label={t('sidebar.teachers')}
          value={teacherValue}
          onChange={handleSelectChange('teacher_id')}
          options={teacherOptions}
          placeholder={t('forms.selectTeacher')}
          error={errors.teacher_id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchSelect
          label={t('sidebar.courses')}
          value={courseValue}
          onChange={handleCourseChange}
          options={moduleCourseOptions}
          isLoading={moduleCoursesLoading}
          placeholder={form.module_id ? t('forms.selectCourse') : t('forms.selectModuleFirst')}
          error={errors.course_id}
          disabled={!form.module_id}
        />
        <Input
          label={t('forms.durationHours')}
          type="number"
          min={1}
          value={form.duration}
          onChange={handleInputChange('duration')}
          helperText={t('forms.hoursPerSession')}
          error={errors.duration}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-3 h-10">
            <input
              id="allday"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={form.allday}
              onChange={handleInputChange('allday')}
            />
            <label htmlFor="allday" className="text-sm font-medium text-body">
              {t('forms.allDaySession')}
            </label>
          </div>
        </div>
        <Input
          label={t('forms.weeklyFrequency')}
          type="number"
          min={1}
          value={form.weeklyFrequency}
          onChange={handleInputChange('weeklyFrequency')}
          helperText={form.allday ? t('forms.notRequiredForAllDay') : t('forms.timesPerWeekCourseRepeats')}
          error={errors.weeklyFrequency}
          disabled={form.allday}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Volume"
            type="number"
            min={0}
            value={form.volume}
            onChange={handleInputChange('volume')}
            helperText={
              isVolumeManual
                ? t('forms.totalHoursPlanned')
                : form.allday
                ? `${t('forms.calculated')}: 5 ${t('forms.days')} × ${form.duration || 0} ${t('forms.hours')} = ${form.volume || 0} ${t('forms.hours')}`
                : `${t('forms.calculated')}: ${form.weeklyFrequency || 0} ${t('forms.sessionsPerWeek')} × ${form.duration || 0} ${t('forms.hours')} = ${form.volume || 0} ${t('forms.hours')}`
            }
            error={errors.volume}
          />
          {!isVolumeManual && (
            <button
              type="button"
              onClick={() => setIsVolumeManual(true)}
              className="mt-1 text-xs text-secondary hover:text-secondary/80 underline"
            >
              {t('forms.editManually')}
            </button>
          )}
        </div>
        <Select
          label={t('common.status')}
          name="status"
          value={form.status}
          onChange={handleStatusChange}
          options={statusOptionsSelect}
          error={errors.status}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-body mb-2">{t('forms.descriptionOptional')}</label>
        <RichTextEditor value={form.description} onChange={handleDescriptionChange} placeholder={t('forms.provideAdditionalDetails')} rows={6} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? t('forms.updateClassCourse') : t('forms.createClassCourse')}
        </Button>
      </div>
    </form>
  );
};

export default ClassCourseForm;


