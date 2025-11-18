import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlanningStudentEntry, GetPlanningStudentParams } from '../../api/planningStudent';
import type { ClassEntity } from '../../api/classes';
import type { Course } from '../../api/course';
import {
  usePlanningStudents,
  useCreatePlanningStudent,
  useUpdatePlanningStudent,
  useDeletePlanningStudent,
} from '../../hooks/usePlanningStudents';
import { useClasses } from '../../hooks/useClasses';
import { useTeachers } from '../../hooks/useTeachers';
import { useClassRooms } from '../../hooks/useClassRooms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useCourses } from '../../hooks/useCourses';
// import { useCompanies } from '../../hooks/useCompanies'; // Removed - company is auto-set from authenticated user
import { usePlanningSessionTypes, useCreatePlanningSessionType } from '../../hooks/usePlanningSessionTypes';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import PlanningWeekView from '../planning/PlanningWeekView';
import PlanningMonthView from '../planning/PlanningMonthView';
import {
  PLANNING_STATUS_OPTIONS_FORM,
  DEFAULT_PLANNING_STATUS,
  type PlanningStatus,
} from '../../constants/planning';
import PlanningSessionTypeModal, { type PlanningSessionTypeFormValues } from '../modals/PlanningSessionTypeModal';

interface PlanningFilters {
  status: PlanningStatus | '' | 'all';
  class_id: number | '';
  class_room_id: number | '';
  teacher_id: number | '';
  specialization_id: number | '';
  planning_session_type_id: number | '';
  course_id: number | '';
}

interface PlanningState {
  data: PlanningStudentEntry[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: PlanningFilters;
}

interface FormState {
  school_year_id: number | '';
  period: string;
  date_day: string;
  hour_start: string;
  hour_end: string;
  class_id: number | '';
  specialization_id: number | '';
  teacher_id: number | '';
  class_room_id: number | '';
  planning_session_type_id: number | '';
  course_id: number | '';
  status: PlanningStatus;
}

interface FormSectionProps {
  form: FormState;
  formErrors: Record<string, string>;
  formAlert: { type: 'success' | 'error'; message: string } | null;
  isSubmitting: boolean;
  isDeleting: boolean;
  selectedEntry: PlanningStudentEntry | null;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSelectChange: (name: keyof FormState) => (value: number | '' | string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  teacherOptions: SearchSelectOption[];
  specializationOptions: SearchSelectOption[];
  classOptions: SearchSelectOption[];
  roomOptions: SearchSelectOption[];
  periodOptions: SearchSelectOption[];
  sessionTypeOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  yearOptions: SearchSelectOption[];
  periodsLoading: boolean;
  teachersLoading: boolean;
  classesLoading: boolean;
  roomsLoading: boolean;
  yearsLoading: boolean;
  sessionTypesLoading: boolean;
  coursesLoading: boolean;
  onOpenSessionTypeModal: () => void;
  isCreatingSessionType: boolean;
  classDetails: ClassEntity | null;
  courseDetails: Course | null;
}

const INITIAL_PAGINATION = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const getMonday = (input: Date) => {
  const date = new Date(input);
  const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatISODate = (date: Date) => date.toISOString().split('T')[0];

const normalizeTimeFormat = (time: string) => time?.split(':').slice(0, 2).join(':') || '';

// Generate time options from 06:00 to 00:00 (24:00) with 15-minute intervals
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  // From 06:00 to 23:45
  for (let hour = 6; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  // Add 00:00 (midnight)
  options.push('00:00');
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const INITIAL_FORM = (weekStart: Date): FormState => ({
  school_year_id: '',
  period: '',
  date_day: formatISODate(weekStart),
  hour_start: '06:00',
  hour_end: '07:00',
  class_id: '',
  specialization_id: '',
  teacher_id: '',
  class_room_id: '',
  planning_session_type_id: '',
  course_id: '',
  status: DEFAULT_PLANNING_STATUS,
});

interface InfoPopoverTriggerProps {
  isOpen: boolean;
  disabled?: boolean;
  onToggle: (open: boolean) => void;
  openLabel?: string;
  closeLabel?: string;
  widthClass?: string;
  children: React.ReactNode;
}

const InfoPopoverTrigger: React.FC<InfoPopoverTriggerProps> = ({
  isOpen,
  disabled,
  onToggle,
  openLabel = 'View info',
  closeLabel = 'Hide info',
  widthClass = 'w-72',
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!isOpen)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
          disabled
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
        </svg>
        {isOpen ? closeLabel : openLabel}
      </button>
      {!disabled && isOpen && (
        <div
          className={`absolute right-0 z-50 mt-2 ${widthClass} rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl ring-1 ring-black/5`}
        >
          <div className="pointer-events-none absolute -top-3 right-10 h-5 w-5 rotate-45 border border-blue-100 bg-white shadow-sm ring-1 ring-black/5" />
          <div className="relative z-10">{children}</div>
        </div>
      )}
    </div>
  );
};

interface DetailCardProps {
  title: string;
  badge?: string;
  items: Array<{ label: string; value?: React.ReactNode }>;
  description?: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, badge, items, description }) => {
  const formattedDescription = React.useMemo(() => {
    if (!description) return null;
    if (typeof description !== 'string') return description;
    return description
      .split('<br>')
      .map((paragraph, idx) => (
        <p key={idx} className="mb-2 last:mb-0">
          {paragraph.replace(/<[^>]*>?/gm, '').trim()}
        </p>
      ));
  }, [description]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Details</p>
        {badge && (
          <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">{badge}</span>
        )}
      </div>
      <p className="mt-2 text-base font-semibold text-blue-900">{title}</p>
      <dl className="mt-3 space-y-2 text-sm text-blue-900">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-blue-50/70 px-3 py-1.5">
            <dt className="text-xs uppercase text-blue-500">{item.label}</dt>
            <dd className="font-medium text-right text-blue-900">{item.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {formattedDescription && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl bg-blue-50/70 px-4 py-3 text-xs text-blue-800 leading-relaxed shadow-inner">
          {formattedDescription}
        </div>
      )}
    </div>
  );
};

const FormSection: React.FC<FormSectionProps> = ({
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
  onOpenSessionTypeModal,
  isCreatingSessionType,
  classDetails,
  courseDetails,
}) => {
  const statusOptions = PLANNING_STATUS_OPTIONS_FORM;
  const timeSelectOptions: SearchSelectOption[] = TIME_OPTIONS.map((time) => ({ value: time, label: time }));
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const canSelectClass = Boolean(form.school_year_id && form.period);

  useEffect(() => {
    if (!classDetails) {
      setShowClassDetails(false);
    }
  }, [classDetails]);
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
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedEntry ? 'Edit session' : 'Add session'}
          </h2>
          <p className="text-sm text-gray-500">Fill out the details to schedule a session.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
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
                  setForm((prev) => ({ ...prev, hour_start: value === '' ? '' : String(value) }));
                  if (formErrors.hour_start) setFormErrors((prev) => ({ ...prev, hour_start: '' }));
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
                options={timeSelectOptions}
                placeholder="End time"
                error={formErrors.hour_end}
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
                <InfoPopoverTrigger
                  disabled={!form.class_id || !classDetails}
                  isOpen={showClassDetails}
                  onToggle={setShowClassDetails}
                  openLabel="View info"
                  closeLabel="Hide info"
                  widthClass="w-[22rem]"
                >
                  {classDetails && (
                    <DetailCard
                      title={classDetails.title}
                      badge={classDetails.status === 1 ? 'Active' : 'Draft'}
                      items={[
                        { label: 'Program', value: classDetails.program?.title || '—' },
                        { label: 'Specialization', value: classDetails.specialization?.title || '—' },
                        { label: 'Level', value: classDetails.level?.title || '—' },
                        { label: 'School Year', value: classDetails.schoolYear?.title || '—' },
                      ]}
                      description={classDetails.description}
                    />
                  )}
                </InfoPopoverTrigger>
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
                  specializationDisplay
                    ? 'bg-white text-gray-900 border-gray-200'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                {specializationDisplay || 'Select a class to view specialization'}
              </div>
              {formErrors.specialization_id && (
                <p className="text-xs text-red-600">{formErrors.specialization_id}</p>
              )}
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
                <button
                  type="button"
                  onClick={onOpenSessionTypeModal}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  disabled={isCreatingSessionType}
                >
                  {isCreatingSessionType ? 'Creating…' : 'New type'}
                </button>
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
                          value: courseDetails.updated_at
                            ? new Date(courseDetails.updated_at).toLocaleDateString()
                            : '—',
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
              onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) as PlanningStatus }))}
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
    </div>
  );
};

const PlanningSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const [currentMonthStart, setCurrentMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [state, setState] = useState<PlanningState>({
    data: [],
    loading: false,
    error: null,
    pagination: INITIAL_PAGINATION,
    filters: {
      status: 'all',
      class_id: '',
      class_room_id: '',
      teacher_id: '',
      specialization_id: '',
      planning_session_type_id: '',
      course_id: '',
    },
  });
  const [selectedEntry, setSelectedEntry] = useState<PlanningStudentEntry | null>(null);
  const [form, setForm] = useState<FormState>(() => INITIAL_FORM(currentWeekStart));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formAlert, setFormAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [conflictSlot, setConflictSlot] = useState<{ date_day: string; hour_start: string; hour_end: string } | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [showSessionTypeModal, setShowSessionTypeModal] = useState(false);
  const [sessionTypeModalError, setSessionTypeModalError] = useState<string | null>(null);

  // 🧠 useMemo for stable query params
  const params = useMemo(() => {
    const p: GetPlanningStudentParams = {
      page: state.pagination.page,
      limit: state.pagination.limit,
      order: 'ASC',
    };
    const f = state.filters;
    if (f.status) {
      if (typeof f.status === 'number') {
        p.status = f.status;
      } else if (f.status === 'all') {
        // Don't filter by status - show all
      } else if (f.status !== '') {
        // String representation of number
        const statusNum = Number(f.status);
        if (!isNaN(statusNum)) p.status = statusNum as PlanningStatus;
      }
    }
    if (f.class_id) p.class_id = +f.class_id;
    if (f.class_room_id) p.class_room_id = +f.class_room_id;
    if (f.teacher_id) p.teacher_id = +f.teacher_id;
    if (f.specialization_id) p.specialization_id = +f.specialization_id;
    if (f.planning_session_type_id) p.planning_session_type_id = +f.planning_session_type_id;
    if (f.course_id) p.course_id = +f.course_id;
    return p;
  }, [state.filters, state.pagination.page, state.pagination.limit]);

  // 🧩 Queries
  const planningQuery = usePlanningStudents(params);
  const { data: planningResp, isLoading, error } = planningQuery;

  // 🧩 Sync planning state
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      loading: isLoading,
      error: error ? (error as Error).message : null,
      data: planningResp?.data ?? [],
      pagination: planningResp?.meta ?? INITIAL_PAGINATION,
    }));
  }, [planningResp, isLoading, error]);

  // ⌨️ Keyboard shortcut: Ctrl/Cmd + F to toggle form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowForm((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🧩 Data for selects
  const { data: classes, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 } as any);
  const { data: teachers, isLoading: teachersLoading } = useTeachers({ page: 1, limit: 100 } as any);
  const { data: rooms, isLoading: roomsLoading } = useClassRooms({ page: 1, limit: 100 } as any);
  const { data: specs, isLoading: specsLoading } = useSpecializations({ page: 1, limit: 100 } as any);
  const { data: schoolYears, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 } as any);
  const { data: coursesResp, isLoading: coursesLoading } = useCourses({ page: 1, limit: 100 } as any);
  // const { data: companies } = useCompanies({ page: 1, limit: 100 } as any); // Removed - company is auto-set from authenticated user
  const { data: periods, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: form.school_year_id === '' ? undefined : Number(form.school_year_id),
  } as any);
  const {
    data: sessionTypesResp,
    isLoading: sessionTypesLoading,
    refetch: refetchSessionTypes,
  } = usePlanningSessionTypes({ page: 1, limit: 100, status: 'active' });
  const createSessionTypeMut = useCreatePlanningSessionType();

  const mapOptions = (data: any[], labelKey: string): SearchSelectOption[] =>
    (data || [])
      .filter((i) => i?.status !== -2)
      .map((i) => ({ value: i.id, label: i[labelKey] || `#${i.id}` }));

  // Create a map of class ID to class data for quick lookup
  const classesMap = useMemo(() => {
    const map = new Map<number, any>();
    (classes?.data || []).forEach((cls: any) => {
      map.set(cls.id, cls);
    });
    return map;
  }, [classes]);

  const classOptions = useMemo(() => mapOptions(classes?.data || [], 'title'), [classes]);
  const formClassOptions = useMemo(() => {
    const yearId = form.school_year_id ? Number(form.school_year_id) : null;
    const periodId = form.period ? Number(form.period) : null;
    if (!yearId || !periodId) return [];

    return (classes?.data || [])
      .filter((cls: ClassEntity) => {
        if (yearId && cls.school_year_id !== yearId) return false;
        if (periodId && cls.school_year_period_id !== periodId) return false;
        return true;
      })
      .map((cls: ClassEntity) => ({
        value: cls.id,
        label: cls.title || `Class #${cls.id}`,
      }));
  }, [classes, form.school_year_id, form.period]);
  const teacherOptions = useMemo(
    () =>
      (teachers?.data || [])
        .filter((t: any) => t?.status !== -2)
        .map((t: any) => ({
          value: t.id,
          label: `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim() || t.email || `Teacher #${t.id}`,
        })),
    [teachers]
  );
  const roomOptions = useMemo(() => mapOptions(rooms?.data || [], 'title'), [rooms]);
  const specializationOptions = useMemo(() => mapOptions(specs?.data || [], 'title'), [specs]);
  const yearOptions = useMemo(() => mapOptions(schoolYears?.data || [], 'title'), [schoolYears]);
  const periodOptions = useMemo(() => mapOptions(periods?.data || [], 'title'), [periods]);
  // const companyOptions removed - company is auto-set from authenticated user
  const sessionTypeOptions = useMemo(
    () =>
      (sessionTypesResp?.data || []).map((type) => ({
        value: type.id,
        label: type.type ? `${type.title} (${type.type})` : type.title || `Type #${type.id}`,
      })),
    [sessionTypesResp]
  );
  const courseOptions = useMemo(
    () =>
      (coursesResp?.data || [])
        .filter((course: any) => course?.status !== -2)
        .map((course: Course) => ({
          value: course.id,
          label: course.title || `Course #${course.id}`,
        })),
    [coursesResp]
  );
  const coursesMap = useMemo(() => {
    const map = new Map<number, Course>();
    (coursesResp?.data || []).forEach((course: Course) => {
      map.set(course.id, course);
    });
    return map;
  }, [coursesResp]);
  const selectedClassDetails = useMemo<ClassEntity | null>(() => {
    if (!form.class_id) return null;
    return classesMap.get(Number(form.class_id)) ?? null;
  }, [form.class_id, classesMap]);
  const selectedCourseDetails = useMemo<Course | null>(() => {
    if (!form.course_id) return null;
    return coursesMap.get(Number(form.course_id)) ?? null;
  }, [form.course_id, coursesMap]);
  const periodLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    periodOptions.forEach((option) => {
      map[String(option.value)] = option.label;
    });
    return map;
  }, [periodOptions]);
  const getPeriodLabel = useCallback(
    (entry: PlanningStudentEntry) => {
      const key = entry.period !== undefined && entry.period !== null ? String(entry.period) : '';
      return periodLabelMap[key] ?? entry.period ?? '';
    },
    [periodLabelMap]
  );
  const statusFilterOptions = useMemo(() => [
    { value: 'all', label: 'All statuses' },
    ...PLANNING_STATUS_OPTIONS_FORM.map((item) => ({ value: String(item.value), label: item.label })),
  ], []);

  // 🧭 Filter by current week (excluding deleted items with status -2)
  const weekEntries = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const startISO = formatISODate(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    end.setHours(23, 59, 59, 999);
    const endISO = formatISODate(end);
    return state.data.filter((e) => {
      // Filter out deleted items (status -2)
      if (typeof e.status === 'number' && e.status === -2) return false;
      return e.date_day >= startISO && e.date_day <= endISO;
    });
  }, [state.data, currentWeekStart]);

  // 🧭 Filter by current month (excluding deleted items with status -2)
  const monthEntries = useMemo(() => {
    const year = currentMonthStart.getFullYear();
    const month = currentMonthStart.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startISO = formatISODate(start);
    const endISO = formatISODate(end);
    return state.data.filter((e) => {
      // Filter out deleted items (status -2)
      if (typeof e.status === 'number' && e.status === -2) return false;
      return e.date_day >= startISO && e.date_day <= endISO;
    });
  }, [state.data, currentMonthStart]);

  // 🔁 Handlers
  const resetForm = useCallback(() => {
    setSelectedEntry(null);
    setForm(INITIAL_FORM(currentWeekStart));
    setFormErrors({});
    setFormAlert(null);
    setConflictSlot(null);
  }, [currentWeekStart]);

  const handleFilterChange = useCallback(
    (name: keyof PlanningFilters) => (value: number | string | '') => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, [name]: value },
        pagination: { ...prev.pagination, page: 1 },
      }));
    },
    []
  );

  const handleSelectEntry = useCallback((entry: PlanningStudentEntry) => {
    setSelectedEntry(entry);
    setForm({
      school_year_id: entry.school_year_id ?? '',
      period: entry.period ?? '',
      date_day: entry.date_day,
      hour_start: normalizeTimeFormat(entry.hour_start),
      hour_end: normalizeTimeFormat(entry.hour_end),
      class_id: entry.class_id ?? '',
      specialization_id: entry.specialization_id ?? '',
      teacher_id: entry.teacher_id ?? '',
      class_room_id: entry.class_room_id ?? '',
      planning_session_type_id: entry.planning_session_type_id,
      course_id: entry.course_id ?? '',
      status: entry.status ?? DEFAULT_PLANNING_STATUS,
    });
    setFormErrors({});
    setFormAlert(null);
    setConflictSlot(null);
    setShowForm(true);
  }, []);

  const handleWeekChange = useCallback((offset: number) => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offset);
      return getMonday(next);
    });
  }, []);

  const handleWeekDateSelect = useCallback((isoDate: string) => {
    if (!isoDate) return;
    const selected = new Date(isoDate);
    if (Number.isNaN(selected.getTime())) return;
    setCurrentWeekStart(getMonday(selected));
  }, []);

  const handleMonthChange = useCallback((offset: number) => {
    setCurrentMonthStart((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  }, []);

  const handleMonthDateSelect = useCallback((isoDate: string) => {
    if (!isoDate) return;
    const selected = new Date(isoDate);
    if (Number.isNaN(selected.getTime())) return;
    setCurrentMonthStart(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    setCurrentMonthStart(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const handleOpenSessionTypeModal = useCallback(() => {
    setSessionTypeModalError(null);
    setShowSessionTypeModal(true);
  }, []);

  const handleCloseSessionTypeModal = useCallback(() => {
    setShowSessionTypeModal(false);
    setSessionTypeModalError(null);
  }, []);

  const handleCreateSessionType = useCallback(
    async (values: PlanningSessionTypeFormValues) => {
      setSessionTypeModalError(null);
      try {
        const result = await createSessionTypeMut.mutateAsync({
          ...values,
          coefficient: values.coefficient ?? undefined,
          // company_id is automatically set by the API from authenticated user
        });
        await refetchSessionTypes();
        if (result.status === 'active') {
          setForm((prev) => ({
            ...prev,
            planning_session_type_id: result.id,
          }));
          setFormErrors((prev) => ({ ...prev, planning_session_type_id: '' }));
          setFormAlert({ type: 'success', message: 'Session type created and selected.' });
        } else {
          setFormAlert({
            type: 'success',
            message: 'Session type created. Activate it to use when scheduling sessions.',
          });
        }
      } catch (err: any) {
        const message = extractErrorMessage(err);
        setSessionTypeModalError(message);
        throw err;
      }
    },
    [createSessionTypeMut, refetchSessionTypes]
  );

  // 🧩 Mutations
  const createMut = useCreatePlanningStudent();
  const updateMut = useUpdatePlanningStudent();
  const deleteMut = useDeletePlanningStudent();

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (form.school_year_id === '') e.school_year_id = 'School year is required';
    if (!form.period) e.period = 'Period is required';
    if (!form.date_day) e.date_day = 'Date is required';
    if (!form.hour_start) e.hour_start = 'Start time is required';
    if (!form.hour_end) e.hour_end = 'End time is required';
    if (form.hour_start >= form.hour_end) e.hour_end = 'End must be after start';
    if (form.class_id === '') e.class_id = 'Class is required';
    if (form.specialization_id === '') e.specialization_id = 'Specialization is required';
    if (form.teacher_id === '') e.teacher_id = 'Teacher is required';
    if (form.class_room_id === '') e.class_room_id = 'Classroom is required';
    if (form.planning_session_type_id === '') e.planning_session_type_id = 'Session type is required';
    if (form.course_id === '') e.course_id = 'Course is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setFormAlert(null);
      return;
    }

    const payload = {
      period: form.period.trim(),
      date_day: form.date_day,
      hour_start: normalizeTimeFormat(form.hour_start),
      hour_end: normalizeTimeFormat(form.hour_end),
      teacher_id: +form.teacher_id,
      specialization_id: +form.specialization_id,
      class_id: +form.class_id,
      class_room_id: +form.class_room_id,
      planning_session_type_id: +form.planning_session_type_id,
      course_id: +form.course_id,
      school_year_id: form.school_year_id === '' ? undefined : +form.school_year_id,
      status: form.status,
    };

    try {
      if (selectedEntry) {
        await updateMut.mutateAsync({ id: selectedEntry.id, data: payload });
        setFormAlert({ type: 'success', message: 'Planning updated successfully.' });
      } else {
        await createMut.mutateAsync(payload);
        setFormAlert({ type: 'success', message: 'Planning created successfully.' });
      }
      await planningQuery.refetch();
      setConflictSlot(null);
      if (!selectedEntry) setForm(INITIAL_FORM(currentWeekStart));
    } catch (err: any) {
      const msg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(', ')
        : err?.response?.data?.message || err.message || 'Failed to save planning';
      setFormAlert({ type: 'error', message: msg });
      if (msg.toLowerCase().includes('overlap')) {
        setConflictSlot({ date_day: form.date_day, hour_start: form.hour_start, hour_end: form.hour_end });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      await deleteMut.mutateAsync(selectedEntry.id);
      setFormAlert({ type: 'success', message: 'Deleted successfully.' });
      await planningQuery.refetch();
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete planning';
      setFormAlert({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;
  const isDeleting = deleteMut.isPending;

  const handleSelectChange = useCallback((name: keyof FormState) => (value: number | '' | string) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value === '' ? '' : Number(value),
      };
      // Auto-select specialization when class is selected
      if (name === 'class_id' && value !== '') {
        const selectedClass = classesMap.get(Number(value));
        if (selectedClass?.specialization_id) {
          updated.specialization_id = selectedClass.specialization_id;
        }
      }
      // Clear period when school year changes
      if (name === 'school_year_id') {
        updated.period = '';
        updated.class_id = '';
        updated.specialization_id = '';
      }
      if (name === 'period') {
        updated.class_id = '';
        updated.specialization_id = '';
      }
      return updated;
    });
    if (formErrors[name as string]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name as string]: '' }));
    }
  }, [formErrors, classesMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Class Planning</h1>
            <p className="text-sm text-gray-500">Schedule and manage sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm ${
                  showForm
                    ? 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    : 'text-white bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-md'
                }`}
                aria-label={showForm ? 'Hide form to view full schedule' : 'Show form to add or edit sessions'}
                title={showForm ? 'Hide form (Ctrl+F)' : 'Show form (Ctrl+F)'}
              >
                {showForm ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Hide Form</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Show Form</span>
                  </>
                )}
              </button>
              <span className="text-xs text-gray-400 hidden sm:inline">Press Ctrl+F to toggle</span>
            </div>
          </div>
        </div>
      

      {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <SearchSelect
            label="Status"
            value={state.filters.status}
            onChange={(value) => handleFilterChange('status')(value === 'all' ? '' : value)}
            options={statusFilterOptions}
            placeholder="All statuses"
            isClearable={false}
          />
          <SearchSelect
            label="Class"
            value={state.filters.class_id}
            onChange={handleFilterChange('class_id')}
            options={classOptions}
            placeholder="All classes"
            isClearable
            isLoading={classesLoading}
          />
          <SearchSelect
            label="Teacher"
            value={state.filters.teacher_id}
            onChange={handleFilterChange('teacher_id')}
            options={teacherOptions}
            placeholder="All teachers"
            isClearable
            isLoading={teachersLoading}
          />
          <SearchSelect
            label="Classroom"
            value={state.filters.class_room_id}
            onChange={handleFilterChange('class_room_id')}
            options={roomOptions}
            placeholder="All rooms"
            isClearable
            isLoading={roomsLoading}
          />
          <SearchSelect
            label="Specialization"
            value={state.filters.specialization_id}
            onChange={handleFilterChange('specialization_id')}
            options={specializationOptions}
            placeholder="All specializations"
            isClearable
            isLoading={specsLoading}
          />
          <SearchSelect
            label="Session Type"
            value={state.filters.planning_session_type_id}
            onChange={handleFilterChange('planning_session_type_id')}
            options={sessionTypeOptions}
            placeholder="All session types"
            isClearable
            isLoading={sessionTypesLoading}
          />
          <SearchSelect
            label="Course"
            value={state.filters.course_id}
            onChange={handleFilterChange('course_id')}
            options={courseOptions}
            placeholder="All courses"
            isClearable
            isLoading={coursesLoading}
          />
        </div>
        {state.error && (
          <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700 rounded-md">
            {state.error}
          </div>
        )}
      

      {/* Main */}
      <div className={`grid gap-6 ${showForm ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {showForm && (
          <FormSection
            form={form}
            formErrors={formErrors}
            formAlert={formAlert}
            isSubmitting={isSubmitting}
            isDeleting={isDeleting}
            selectedEntry={selectedEntry}
            resetForm={resetForm}
            handleSubmit={handleSubmit}
            handleDelete={handleDelete}
            handleSelectChange={handleSelectChange}
            setForm={setForm}
            setFormErrors={setFormErrors}
            teacherOptions={teacherOptions}
            specializationOptions={specializationOptions}
            classOptions={formClassOptions}
            roomOptions={roomOptions}
            periodOptions={periodOptions}
            sessionTypeOptions={sessionTypeOptions}
            courseOptions={courseOptions}
            yearOptions={yearOptions}
            periodsLoading={periodsLoading}
            teachersLoading={teachersLoading}
            classesLoading={classesLoading}
            roomsLoading={roomsLoading}
            yearsLoading={yearsLoading}
            sessionTypesLoading={sessionTypesLoading}
            coursesLoading={coursesLoading}
            onOpenSessionTypeModal={handleOpenSessionTypeModal}
            isCreatingSessionType={createSessionTypeMut.isPending}
            classDetails={selectedClassDetails}
            courseDetails={selectedCourseDetails}
          />
        )}

        <div className="relative">
          {viewMode === 'week' ? (
            <PlanningWeekView
              weekStart={currentWeekStart}
              entries={weekEntries}
              isLoading={state.loading}
              conflictSlot={conflictSlot}
              onPrevWeek={() => handleWeekChange(-7)}
              onNextWeek={() => handleWeekChange(7)}
              onToday={handleToday}
              onSelectEntry={handleSelectEntry}
              onSelectDate={handleWeekDateSelect}
              getPeriodLabel={getPeriodLabel}
            />
          ) : (
            <PlanningMonthView
              monthStart={currentMonthStart}
              entries={monthEntries}
              isLoading={state.loading}
              conflictSlot={conflictSlot}
              onPrevMonth={() => handleMonthChange(-1)}
              onNextMonth={() => handleMonthChange(1)}
              onToday={handleToday}
              onSelectEntry={handleSelectEntry}
              onSelectDate={handleMonthDateSelect}
              getPeriodLabel={getPeriodLabel}
            />
          )}
          
          {/* Floating Action Button - Show when form is hidden */}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Show form to add or edit sessions"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold text-base">Show Form</span>
            </button>
          )}
        </div>
      </div>

      <PlanningSessionTypeModal
        isOpen={showSessionTypeModal}
        onClose={handleCloseSessionTypeModal}
        onSubmit={handleCreateSessionType}
        isSubmitting={createSessionTypeMut.isPending}
        serverError={sessionTypeModalError}
      />
    </div>
  );
};

export default PlanningSection;
