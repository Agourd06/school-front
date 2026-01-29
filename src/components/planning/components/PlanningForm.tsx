import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SearchSelect from '../../inputs/SearchSelect';
import { PLANNING_STATUS_OPTIONS_FORM } from '../../../constants/planning';
import { TIME_OPTIONS } from '../utils';
import { DetailCard, InfoPopoverTrigger } from './InfoPopover';
import ClassStudentsModal from './ClassStudentsModal';
import type { PlanningFormProps } from '../types';
import { Copy } from 'lucide-react';

const PlanningForm: React.FC<PlanningFormProps & { onDuplicate?: () => void }> = ({
  form,
  formErrors,
  formAlert,
  isSubmitting,
  isDeleting,
  selectedEntry,
  resetForm,
  handleSubmit,
  handleDelete,
  handleSelectChange,
  setForm,
  setFormErrors,
  onDuplicate,
  teacherOptions,
  classOptions,
  roomOptions,
  periodOptions,
  sessionTypeOptions,
  courseOptions,
  yearOptions,
  periodsLoading,
  teachersLoading,
  classesLoading,
  roomsLoading,
  yearsLoading,
  sessionTypesLoading,
  coursesLoading,
  
  classDetails,
  courseDetails,
  classStudents,
  classStudentsLoading,
  classStudentsError,
  classCourseOptions,
  classCourseLoading,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusOptions = PLANNING_STATUS_OPTIONS_FORM;
  const timeSelectOptions = useMemo(() => TIME_OPTIONS.map((time) => ({ value: time, label: time })), []);
  const endTimeOptions = useMemo(() => {
    if (!form.hour_start) return timeSelectOptions;
    return timeSelectOptions.filter((option) => String(option.value) > String(form.hour_start));
  }, [timeSelectOptions, form.hour_start]);
  const [isClassStudentsModalOpen, setIsClassStudentsModalOpen] = useState(false);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  // Class can be selected first, no dependencies
  const handleClassCourseChange = (value: number | '' | string) => {
    setForm((prev) => {
      if (value === '' || value === null) {
        return { ...prev, class_course_id: '', course_id: '', teacher_id: '' };
      }
      const numericValue = Number(value);
      const matched = classCourseOptions.find((option) => Number(option.value) === numericValue);
      const data = matched?.data as { course_id?: number; teacher_id?: number } | undefined;
      return {
        ...prev,
        class_course_id: numericValue,
        course_id: data?.course_id ?? prev.course_id,
        teacher_id: data?.teacher_id ?? prev.teacher_id,
      };
    });
    if (formErrors.class_course_id) setFormErrors((prev) => ({ ...prev, class_course_id: '' }));
    if (formErrors.course_id) setFormErrors((prev) => ({ ...prev, course_id: '' }));
    if (formErrors.teacher_id) setFormErrors((prev) => ({ ...prev, teacher_id: '' }));
  };

  useEffect(() => {
    if (!form.class_id) {
      setIsClassStudentsModalOpen(false);
    }
  }, [form.class_id]);

  useEffect(() => {
    if (!courseDetails) {
      setShowCourseDetails(false);
    }
  }, [courseDetails]);


  return (
    <div className="bg-surface shadow rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-heading">{selectedEntry ? t('planning.editSession') : t('planning.addSession')}</h2>
          <p className="text-sm text-muted">
            {selectedEntry ? t('forms.editPlanningDetailsOrDuplicate') : t('forms.fillDetailsToScheduleSession')}
          </p>
        </div>
        <button type="button" onClick={resetForm} className="text-sm text-primary hover:text-primary/80">
          {t('forms.newSession')}
        </button>
      </div>

      {formAlert && (
        <div
          className={`mb-4 px-3 py-2 rounded-md text-sm ${
            formAlert.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {formAlert.message}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Row 1: School Year / Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sidebar.schoolYears')} *</label>
            <SearchSelect
              value={form.school_year_id}
              onChange={handleSelectChange('school_year_id')}
              options={yearOptions}
              placeholder={t('forms.selectSchoolYear')}
              isLoading={yearsLoading}
              error={formErrors.school_year_id}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sidebar.periods')} *</label>
            <SearchSelect
              value={form.period}
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  period: value === '' ? '' : String(value),
                }));
                if (formErrors.period) setFormErrors((prev) => ({ ...prev, period: '' }));
              }}
              options={periodOptions}
              placeholder={form.school_year_id ? t('forms.selectPeriod') : t('forms.selectSchoolYearFirst')}
              isLoading={periodsLoading}
              error={formErrors.period}
              disabled={!form.school_year_id}
            />
          </div>
        </div>

        {/* Row 2: Class / Class Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-heading">{t('sidebar.classes')} *</label>
              <button
                type="button"
                onClick={() => setIsClassStudentsModalOpen(true)}
                disabled={!form.class_id}
                className={`text-xs font-semibold rounded-full border px-3 py-1 transition ${
                  form.class_id
                    ? 'border-primary/30 text-primary hover:border-primary/50 hover:text-primary/80'
                    : 'border-border text-muted cursor-not-allowed'
                }`}
              >
                {t('forms.viewStudents')}
              </button>
            </div>
            <SearchSelect
              value={form.class_id}
              onChange={handleSelectChange('class_id')}
              options={classOptions}
              placeholder={form.school_year_id ? t('forms.selectClass') : t('forms.selectSchoolYearFirst')}
              isLoading={classesLoading}
              error={formErrors.class_id}
              disabled={!form.school_year_id}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sections.classCourse')}</label>
            <SearchSelect
              value={form.class_course_id}
              onChange={handleClassCourseChange}
              options={classCourseOptions}
              placeholder={t('forms.selectClassCourse')}
              isLoading={classCourseLoading}
              error={formErrors.class_course_id}
            />
          </div>
        </div>

        {/* Row 3: Course / Teacher / Classroom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-heading">{t('sidebar.courses')} *</label>
              <InfoPopoverTrigger
                disabled={!form.course_id || !courseDetails}
                isOpen={showCourseDetails}
                onToggle={setShowCourseDetails}
                widthClass="w-[22rem]"
              >
                {courseDetails && (
                  <DetailCard
                    title={courseDetails.title}
                    badge={courseDetails.status === 1 ? t('forms.active') : t('common.draft')}
                    items={[
                      { label: t('sections.volume'), value: courseDetails.volume ?? '—' },
                      { label: t('sections.coefficient'), value: courseDetails.coefficient ?? '—' },
                      { label: t('sidebar.modules'), value: courseDetails.modules?.length ?? 0 },
                      {
                        label: t('common.updated'),
                        value: courseDetails.updated_at ? new Date(courseDetails.updated_at).toLocaleDateString() : '—',
                      },
                    ]}
                    description={courseDetails.description}
                  />
                )}
              </InfoPopoverTrigger>
            </div>
            <SearchSelect
              value={form.course_id}
              onChange={handleSelectChange('course_id')}
              options={courseOptions}
              placeholder={t('forms.selectAClassCourseFirst')}
              isLoading={coursesLoading}
              error={formErrors.course_id}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sidebar.teachers')} *</label>
            <SearchSelect
              value={form.teacher_id}
              onChange={handleSelectChange('teacher_id')}
              options={teacherOptions}
              placeholder={t('forms.selectAClassCourseFirst')}
              isLoading={teachersLoading}
              error={formErrors.teacher_id}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sidebar.classRooms')} *</label>
            <SearchSelect
              value={form.class_room_id}
              onChange={handleSelectChange('class_room_id')}
              options={roomOptions}
              placeholder={form.school_year_id && form.period ? t('forms.selectClassroom') : t('forms.selectSchoolYearAndPeriodFirst')}
              isLoading={roomsLoading}
              error={formErrors.class_room_id}
              disabled={!form.school_year_id || !form.period}
            />
          </div>
        </div>

        {/* Row 4: Date / Start Hour / End Hour */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sections.date')} *</label>
            <input
              type="date"
              className={`block w-full px-3 py-2 text-sm border rounded-md ${
                formErrors.date_day ? 'border-red-300' : 'border-border'
              }`}
              value={form.date_day}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, date_day: e.target.value }));
                if (formErrors.date_day) setFormErrors((prev) => ({ ...prev, date_day: '' }));
              }}
            />
            {formErrors.date_day && <p className="mt-1 text-xs text-red-600">{formErrors.date_day}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sections.startHour')} *</label>
            <SearchSelect
              value={form.hour_start}
              onChange={(value) => {
                setForm((prev) => {
                  const nextHourStart = value === '' ? '' : String(value);
                  const shouldResetEnd = prev.hour_end && nextHourStart && prev.hour_end <= nextHourStart;
                  return {
                    ...prev,
                    hour_start: nextHourStart,
                    hour_end: shouldResetEnd ? '' : prev.hour_end,
                  };
                });
                if (formErrors.hour_start) setFormErrors((prev) => ({ ...prev, hour_start: '' }));
                if (formErrors.hour_end) setFormErrors((prev) => ({ ...prev, hour_end: '' }));
              }}
              options={timeSelectOptions}
              placeholder={t('forms.startTime')}
              error={formErrors.hour_start}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sections.endHour')} *</label>
            <SearchSelect
              value={form.hour_end}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, hour_end: value === '' ? '' : String(value) }));
                if (formErrors.hour_end) setFormErrors((prev) => ({ ...prev, hour_end: '' }));
              }}
              options={endTimeOptions}
              placeholder={t('forms.endTime')}
              error={formErrors.hour_end}
              disabled={!form.hour_start}
            />
          </div>
        </div>

        {/* Row 5: Session Type / Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('sections.sessionType')} *</label>
            <SearchSelect
              value={form.planning_session_type_id}
              onChange={handleSelectChange('planning_session_type_id')}
              options={sessionTypeOptions}
              placeholder={t('forms.selectSessionType')}
              isLoading={sessionTypesLoading}
              error={formErrors.planning_session_type_id}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('forms.toCreateAType')}{' '}
              <button
                type="button"
                onClick={() => navigate('/settings/types/planning')}
                className="font-medium text-secondary hover:text-secondary/80 underline cursor-pointer transition-colors"
              >
                {t('forms.settings')}
              </button>
              {' > '}{t('forms.types')}{' > '}{t('forms.planningSessionTypes')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-1">{t('common.status')}</label>
            <select
              className="custom-select block w-full px-3 py-2 text-sm border border-border bg-card text-body rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) as typeof form.status }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-tertiary/20">
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
              title={selectedEntry ? t('forms.duplicateThisPlanning') : t('forms.createThisPlanningAndDuplicate')}
            >
              <Copy className="h-4 w-4" />
              {selectedEntry ? t('forms.duplicate') : t('forms.createAndDuplicate')}
            </button>
          )}
          {selectedEntry && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60 transition-colors"
            >
              {isDeleting ? t('forms.deleting') : t('modals.delete')}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? t('forms.saving') : selectedEntry ? t('forms.updateSession') : t('forms.createSession')}
          </button>
        </div>
      </form>

      <ClassStudentsModal
        isOpen={isClassStudentsModalOpen}
        onClose={() => setIsClassStudentsModalOpen(false)}
        students={classStudents}
        isLoading={classStudentsLoading}
        error={classStudentsError}
        classTitle={classDetails?.title}
      />
    </div>
  );
};

export default PlanningForm;


