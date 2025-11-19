import React, { useEffect, useMemo, useState } from 'react';
import SearchSelect from '../../inputs/SearchSelect';
import { PLANNING_STATUS_OPTIONS_FORM } from '../../../constants/planning';
import { TIME_OPTIONS } from '../utils';
import { DetailCard, InfoPopoverTrigger } from './InfoPopover';
import ClassStudentsModal from './ClassStudentsModal';
import type { PlanningFormProps } from '../types';

const PlanningForm: React.FC<PlanningFormProps> = ({
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
  teacherOptions,
  specializationOptions,
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
}) => {
  const statusOptions = PLANNING_STATUS_OPTIONS_FORM;
  const timeSelectOptions = useMemo(() => TIME_OPTIONS.map((time) => ({ value: time, label: time })), []);
  const endTimeOptions = useMemo(() => {
    if (!form.hour_start) return timeSelectOptions;
    return timeSelectOptions.filter((option) => String(option.value) > String(form.hour_start));
  }, [timeSelectOptions, form.hour_start]);
  const [isClassStudentsModalOpen, setIsClassStudentsModalOpen] = useState(false);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const canSelectClass = Boolean(form.school_year_id && form.period);

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

  const specializationDisplay = useMemo(() => {
    if (classDetails?.specialization?.title) return classDetails.specialization.title;
    const option = specializationOptions.find((opt) => Number(opt.value) === form.specialization_id);
    if (option) return option.label;
    if (form.specialization_id) return `Specialization #${form.specialization_id}`;
    return '';
  }, [classDetails, specializationOptions, form.specialization_id]);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{selectedEntry ? 'Edit session' : 'Add session'}</h2>
          <p className="text-sm text-gray-500">Fill out the details to schedule a session.</p>
        </div>
        <button type="button" onClick={resetForm} className="text-sm text-blue-600 hover:text-blue-800">
          New session
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
        {/* Time & Date Section */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SearchSelect
              label="School Year *"
              value={form.school_year_id}
              onChange={handleSelectChange('school_year_id')}
              options={yearOptions}
              placeholder="Select school year"
              isLoading={yearsLoading}
              error={formErrors.school_year_id}
            />
            <SearchSelect
              label="Period *"
              value={form.period}
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  period: value === '' ? '' : String(value),
                  class_id: '',
                  specialization_id: '',
                }));
                if (formErrors.period) setFormErrors((prev) => ({ ...prev, period: '' }));
              }}
              options={periodOptions}
              placeholder="Select period"
              isLoading={periodsLoading}
              error={formErrors.period}
              disabled={!form.school_year_id}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                className={`block w-full px-3 py-2 text-sm border rounded-md ${
                  formErrors.date_day ? 'border-red-300' : 'border-gray-300'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Hour *</label>
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
                placeholder="Start time"
                error={formErrors.hour_start}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Hour *</label>
              <SearchSelect
                value={form.hour_end}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, hour_end: value === '' ? '' : String(value) }));
                  if (formErrors.hour_end) setFormErrors((prev) => ({ ...prev, hour_end: '' }));
                }}
                options={endTimeOptions}
                placeholder="End time"
                error={formErrors.hour_end}
                disabled={!form.hour_start}
              />
            </div>
          </div>
        </div>

        {/* Class & Resources Section */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Class & Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Class *</label>
                <button
                  type="button"
                  onClick={() => setIsClassStudentsModalOpen(true)}
                  disabled={!form.class_id}
                  className={`text-xs font-semibold rounded-full border px-3 py-1 transition ${
                    form.class_id
                      ? 'border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  View students
                </button>
              </div>
              <SearchSelect
                value={form.class_id}
                onChange={handleSelectChange('class_id')}
                options={classOptions}
                placeholder={canSelectClass ? 'Select class' : 'Select year and period first'}
                isLoading={classesLoading}
                error={formErrors.class_id}
                disabled={!canSelectClass}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Specialization</p>
                <span className="text-xs text-gray-400">Auto-selected</span>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 text-sm  ${
                  specializationDisplay ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                {specializationDisplay || 'Select a class to view specialization'}
              </div>
              {formErrors.specialization_id && <p className="text-xs text-red-600">{formErrors.specialization_id}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SearchSelect
              label="Teacher *"
              value={form.teacher_id}
              onChange={handleSelectChange('teacher_id')}
              options={teacherOptions}
              placeholder="Select teacher"
              isLoading={teachersLoading}
              error={formErrors.teacher_id}
            />
            <SearchSelect
              label="Classroom *"
              value={form.class_room_id}
              onChange={handleSelectChange('class_room_id')}
              options={roomOptions}
              placeholder="Select classroom"
              isLoading={roomsLoading}
              error={formErrors.class_room_id}
            />
          </div>
        </div>

        {/* Session Type & Status Section */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Session Type *</label>
              
              </div>
              <SearchSelect
                value={form.planning_session_type_id}
                onChange={handleSelectChange('planning_session_type_id')}
                options={sessionTypeOptions}
                placeholder="Select session type"
                isLoading={sessionTypesLoading}
                error={formErrors.planning_session_type_id}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Course *</label>
                <InfoPopoverTrigger
                  disabled={!form.course_id || !courseDetails}
                  isOpen={showCourseDetails}
                  onToggle={setShowCourseDetails}
                  widthClass="w-[22rem]"
                >
                  {courseDetails && (
                    <DetailCard
                      title={courseDetails.title}
                      badge={courseDetails.status === 1 ? 'Active' : 'Draft'}
                      items={[
                        { label: 'Volume', value: courseDetails.volume ?? '—' },
                        { label: 'Coefficient', value: courseDetails.coefficient ?? '—' },
                        { label: 'Modules', value: courseDetails.modules?.length ?? 0 },
                        {
                          label: 'Updated',
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
                placeholder="Select course"
                isLoading={coursesLoading}
                error={formErrors.course_id}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
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

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {selectedEntry && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : selectedEntry ? 'Update Session' : 'Create Session'}
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


