import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Button } from '../ui';
import type { ClassCourse } from '../../api/classCourse';
import { useModuleCourses } from '../../hooks/useModules';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import type { Program } from '../../api/program';
import type { Specialization } from '../../api/specialization';
import type { Level } from '../../api/level';

export interface ClassCourseFormData {
  description: string;
  program_id: number | '';
  specialization_id: number | '';
  level_id: number | '';
  module_id: number | '';
  course_id: number | '';
  volume: string;
}

interface ClassCourseFormProps {
  initialData?: ClassCourse | null;
  onSubmit: (data: ClassCourseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  moduleOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
}

const ClassCourseForm: React.FC<ClassCourseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  moduleOptions,
  courseOptions,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ClassCourseFormData>({
    description: '',
    program_id: '',
    specialization_id: '',
    level_id: '',
    module_id: '',
    course_id: '',
    volume: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const selectedModuleId = form.module_id ? Number(form.module_id) : undefined;
  const { data: moduleCourses = [], isLoading: moduleCoursesLoading } = useModuleCourses(selectedModuleId);

  useEffect(() => {
    if (initialData) {
      // For editing, populate from existing data
      // Note: We need to get program/specialization from level relation
      const level = initialData.level;
      setForm({
        description: initialData.description ?? '',
        program_id: level?.specialization?.program?.id ?? '',
        specialization_id: level?.specialization?.id ?? '',
        level_id: initialData.level_id ?? '',
        module_id: initialData.module_id ?? '',
        course_id: initialData.course_id ?? '',
        volume: initialData.volume !== undefined && initialData.volume !== null ? String(initialData.volume) : '',
      });
    } else {
      setForm({
        description: '',
        program_id: '',
        specialization_id: '',
        level_id: '',
        module_id: '',
        course_id: '',
        volume: '',
      });
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
    if (form.module_id === '' || form.module_id === null) {
      validationErrors.module_id = t('forms.moduleRequired');
    }
    if (form.course_id === '' || form.course_id === null) {
      validationErrors.course_id = t('forms.courseRequired');
    }

    if (form.volume.trim()) {
      const volumeValue = Number(form.volume);
      if (Number.isNaN(volumeValue) || volumeValue < 0) {
        validationErrors.volume = t('forms.volumeMustBeZeroOrGreater');
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSelectChange = (field: keyof Pick<ClassCourseFormData, 'program_id' | 'specialization_id' | 'level_id' | 'module_id' | 'course_id'>) => (value: number | '' | string) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [field]: value === '' ? '' : Number(value),
      };
      
      // Reset dependent fields
      if (field === 'program_id') {
        updated.specialization_id = '';
        updated.level_id = '';
      }
      if (field === 'specialization_id') {
        updated.level_id = '';
      }
      if (field === 'module_id') {
        updated.course_id = '';
      }
      
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputChange =
    (field: keyof Pick<ClassCourseFormData, 'volume'>) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
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

      {/* Module → Course */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchSelect
          label={`${t('sidebar.modules')} *`}
          value={moduleValue}
          onChange={handleSelectChange('module_id')}
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
      </div>

      {/* Volume */}
      <div>
        <Input
          label={t('sections.volume')}
          type="number"
          min={0}
          value={form.volume}
          onChange={handleInputChange('volume')}
          helperText={t('forms.totalHoursPlanned')}
          error={errors.volume}
        />
      </div>

      {/* Description */}
      <div>
        <label id="description-label" className="block text-sm font-medium text-body mb-2">
          {t('forms.descriptionOptional')}
        </label>
        <RichTextEditor
          value={form.description}
          onChange={handleDescriptionChange}
          placeholder={t('forms.provideAdditionalDetails')}
          rows={6}
          aria-labelledby="description-label"
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
