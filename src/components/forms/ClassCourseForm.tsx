import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import MultiSearchSelect, { type MultiSearchSelectOption } from '../inputs/MultiSearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Button } from '../ui';
import type { ClassCourse } from '../../api/classCourse';
import { useModuleCourses } from '../../hooks/useModules';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useClasses } from '../../hooks/useClasses';
import type { Program } from '../../api/program';
import type { Specialization } from '../../api/specialization';
import type { Level } from '../../api/level';

export interface ClassCourseFormData {
  description: string;
  program_id: number | '';
  specialization_id: number | '';
  level_id: number | '';
  classIds: (number | string)[];
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
  moduleOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  teacherOptions: SearchSelectOption[];
}

const ClassCourseForm: React.FC<ClassCourseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  moduleOptions,
  courseOptions,
  teacherOptions,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ClassCourseFormData>({
    description: '',
    program_id: '',
    specialization_id: '',
    level_id: '',
    classIds: [],
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

  // Fetch programs, specializations, levels
  const { data: programsResp } = usePrograms({ page: 1, limit: 100 });
  const programs = useMemo(() => (programsResp?.data || []) as Program[], [programsResp]);

  const { data: specializationsResp } = useSpecializations({
    page: 1,
    limit: 100,
    program_id: form.program_id ? Number(form.program_id) : undefined,
  });
  const specializations = useMemo(() => (specializationsResp?.data || []) as Specialization[], [specializationsResp]);

  const { data: levelsResp } = useLevels({
    page: 1,
    limit: 100,
    specialization_id: form.specialization_id ? Number(form.specialization_id) : undefined,
    program_id: form.program_id ? Number(form.program_id) : undefined,
  });
  const levels = useMemo(() => (levelsResp?.data || []) as Level[], [levelsResp]);

  // Fetch classes filtered by specialization and level
  const { data: classesResp } = useClasses({
    page: 1,
    limit: 100, // Backend maximum limit is 100
    specialization_id: form.specialization_id ? Number(form.specialization_id) : undefined,
    level_id: form.level_id ? Number(form.level_id) : undefined,
  });
  const filteredClasses = useMemo(() => (classesResp?.data || []), [classesResp]);

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
      // For editing, we'd need to populate from existing data
      // But since we're removing title and changing structure, editing might need special handling
      setForm({
        description: initialData.description ?? '',
        program_id: '', // Would need to fetch from class
        specialization_id: '', // Would need to fetch from class
        level_id: '', // Would need to fetch from class
        classIds: initialData.class_id ? [initialData.class_id] : [],
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
      setIsVolumeManual(true);
    } else {
      setForm({
        description: '',
        program_id: '',
        specialization_id: '',
        level_id: '',
        classIds: [],
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

    if (!form.program_id) {
      validationErrors.program_id = t('forms.programRequired');
    }
    if (!form.specialization_id) {
      validationErrors.specialization_id = t('forms.specializationRequired');
    }
    if (!form.level_id) {
      validationErrors.level_id = t('forms.levelRequired');
    }
    if (form.classIds.length === 0) {
      validationErrors.classIds = t('forms.classRequired') || 'At least one class must be selected';
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

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSelectChange = (field: keyof Pick<ClassCourseFormData, 'program_id' | 'specialization_id' | 'level_id' | 'module_id' | 'course_id' | 'teacher_id'>) => (value: number | '' | string) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [field]: value === '' ? '' : Number(value),
      };
      
      // Reset dependent fields
      if (field === 'program_id') {
        updated.specialization_id = '';
        updated.level_id = '';
        updated.classIds = [];
      }
      if (field === 'specialization_id') {
        updated.level_id = '';
        updated.classIds = [];
      }
      if (field === 'level_id') {
        updated.classIds = [];
      }
      if (field === 'module_id') {
        updated.course_id = '';
        updated.volume = '';
      }
      
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (values: (number | string)[]) => {
    setForm((prev) => ({
      ...prev,
      classIds: values,
    }));
    if (errors.classIds) {
      setErrors((prev) => ({ ...prev, classIds: '' }));
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
  }, [moduleCourses, courseOptions, t]);

  const classOptions = useMemo<MultiSearchSelectOption[]>(() => {
    return filteredClasses.map((cls) => ({
      value: cls.id,
      label: cls.title || `${t('planning.classNumber')}${cls.id}`,
      data: cls,
    }));
  }, [filteredClasses, t]);

  const programOptions = useMemo<SearchSelectOption[]>(
    () => programs.map((program) => ({ value: program.id, label: program.title })),
    [programs]
  );

  const specializationOptions = useMemo<SearchSelectOption[]>(
    () => specializations.map((spec) => ({ value: spec.id, label: spec.title })),
    [specializations]
  );

  const levelOptions = useMemo<SearchSelectOption[]>(
    () => levels.map((level) => ({ value: level.id, label: level.title })),
    [levels]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const programValue = useMemo(() => form.program_id ?? '', [form.program_id]);
  const specializationValue = useMemo(() => form.specialization_id ?? '', [form.specialization_id]);
  const levelValue = useMemo(() => form.level_id ?? '', [form.level_id]);
  const moduleValue = useMemo(() => form.module_id ?? '', [form.module_id]);
  const courseValue = useMemo(() => form.course_id ?? '', [form.course_id]);
  const teacherValue = useMemo(() => form.teacher_id ?? '', [form.teacher_id]);

  const canSelectClasses = form.specialization_id && form.level_id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      {/* Program, Specialization, Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label={`${t('sidebar.programs')} *`}
          value={programValue}
          onChange={handleSelectChange('program_id')}
          options={programOptions}
          placeholder={t('forms.selectProgram') || 'Select program'}
          error={errors.program_id}
        />
        <SearchSelect
          label={`${t('dashboard.specializations')} *`}
          value={specializationValue}
          onChange={handleSelectChange('specialization_id')}
          options={specializationOptions}
          placeholder={form.program_id ? (t('forms.selectSpecialization') || 'Select specialization') : (t('forms.selectProgramFirst') || 'Select program first')}
          error={errors.specialization_id}
          disabled={!form.program_id}
        />
        <SearchSelect
          label={`${t('sidebar.levels')} *`}
          value={levelValue}
          onChange={handleSelectChange('level_id')}
          options={levelOptions}
          placeholder={form.specialization_id ? (t('forms.selectLevel') || 'Select level') : (t('forms.selectSpecializationFirst') || 'Select specialization first')}
          error={errors.level_id}
          disabled={!form.specialization_id}
        />
      </div>

      {/* Classes - Multi-select */}
      <div>
        <MultiSearchSelect
          label={`${t('sidebar.classes')} *`}
          value={form.classIds}
          onChange={handleMultiSelectChange}
          options={classOptions}
          placeholder={
            !canSelectClasses
              ? t('forms.selectSpecializationAndLevel') || 'Select specialization and level first'
              : t('forms.selectClasses') || 'Select classes'
          }
          error={errors.classIds}
          disabled={!canSelectClasses}
          showAllOption={true}
          allOptionLabel={t('forms.allClasses') || 'All classes'}
        />
      </div>

      {/* Module → Course → Teacher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label={`${t('sidebar.modules')} *`}
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
          placeholder={t('forms.selectModule') || 'Select module'}
          error={errors.module_id}
        />
        <SearchSelect
          label={`${t('sidebar.courses')} *`}
          value={courseValue}
          onChange={handleSelectChange('course_id')}
          options={moduleCourseOptions}
          isLoading={moduleCoursesLoading}
          placeholder={form.module_id ? t('forms.selectCourse') : t('forms.selectModuleFirst')}
          error={errors.course_id}
          disabled={!form.module_id}
        />
        <SearchSelect
          label={`${t('sidebar.teachers')} *`}
          value={teacherValue}
          onChange={handleSelectChange('teacher_id')}
          options={teacherOptions}
          placeholder={t('forms.selectTeacher') || 'Select teacher'}
          error={errors.teacher_id}
        />
      </div>

      {/* Duration → Weekly Frequency → Volume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={`${t('forms.durationHours')} *`}
          type="number"
          min={1}
          value={form.duration}
          onChange={handleInputChange('duration')}
          helperText={t('forms.hoursPerSession')}
          error={errors.duration}
        />
        <div>
          <div className="flex items-center gap-3 mb-2">
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
          <Input
            label={`${t('forms.weeklyFrequency')} *`}
            type="number"
            min={1}
            value={form.weeklyFrequency}
            onChange={handleInputChange('weeklyFrequency')}
            helperText={form.allday ? t('forms.notRequiredForAllDay') : t('forms.timesPerWeekCourseRepeats')}
            error={errors.weeklyFrequency}
            disabled={form.allday}
          />
        </div>
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
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-body mb-2">
          {t('forms.descriptionOptional')}
        </label>
        <RichTextEditor
          value={form.description}
          onChange={handleDescriptionChange}
          placeholder={t('forms.provideAdditionalDetails')}
          rows={6}
        />
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
