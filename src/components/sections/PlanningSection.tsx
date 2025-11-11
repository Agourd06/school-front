import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlanningStudentEntry, GetPlanningStudentParams } from '../../api/planningStudent';
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
import { useCompanies } from '../../hooks/useCompanies';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { usePlanningSessionTypes, useCreatePlanningSessionType } from '../../hooks/usePlanningSessionTypes';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import PlanningWeekView from '../planning/PlanningWeekView';
import {
  PLANNING_STATUS_OPTIONS,
  DEFAULT_PLANNING_STATUS,
  type PlanningStatus,
} from '../../constants/planning';
import PlanningSessionTypeModal, { type PlanningSessionTypeFormValues } from '../modals/PlanningSessionTypeModal';

interface PlanningFilters {
  status: PlanningStatus | '';
  class_id: number | '';
  class_room_id: number | '';
  teacher_id: number | '';
  specialization_id: number | '';
  planning_session_type_id: number | '';
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
  period: string;
  date_day: string;
  hour_start: string;
  hour_end: string;
  planning_session_type_id: number | '';
  teacher_id: number | '';
  specialization_id: number | '';
  class_id: number | '';
  class_room_id: number | '';
  company_id: number | '';
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
  companyOptions: SearchSelectOption[];
  periodOptions: SearchSelectOption[];
  sessionTypeOptions: SearchSelectOption[];
  periodsLoading: boolean;
  teachersLoading: boolean;
  specsLoading: boolean;
  classesLoading: boolean;
  roomsLoading: boolean;
  companiesLoading: boolean;
  sessionTypesLoading: boolean;
  onOpenSessionTypeModal: () => void;
  isCreatingSessionType: boolean;
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

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const INITIAL_FORM = (weekStart: Date): FormState => ({
  period: '',
  date_day: formatISODate(weekStart),
  hour_start: '08:00',
  hour_end: '10:00',
  planning_session_type_id: '',
  teacher_id: '',
  specialization_id: '',
  class_id: '',
  class_room_id: '',
  company_id: '',
  status: DEFAULT_PLANNING_STATUS,
});

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
  companyOptions,
  periodOptions,
  sessionTypeOptions,
  periodsLoading,
  teachersLoading,
  specsLoading,
  classesLoading,
  roomsLoading,
  companiesLoading,
  sessionTypesLoading,
  onOpenSessionTypeModal,
  isCreatingSessionType,
}) => {
  const statusOptions = PLANNING_STATUS_OPTIONS;

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Session Type</label>
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
          <SearchSelect
            label="Period"
            value={form.period}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, period: value === '' ? '' : String(value) }));
              if (formErrors.period) setFormErrors((prev) => ({ ...prev, period: '' }));
            }}
            options={periodOptions}
            placeholder="Select period"
            isLoading={periodsLoading}
            error={formErrors.period}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as PlanningStatus }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start</label>
              <input
                type="time"
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  formErrors.hour_start ? 'border-red-300' : 'border-gray-300'
                }`}
                value={form.hour_start}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, hour_start: e.target.value }));
                  if (formErrors.hour_start) setFormErrors((prev) => ({ ...prev, hour_start: '' }));
                }}
              />
              {formErrors.hour_start && <p className="mt-1 text-xs text-red-600">{formErrors.hour_start}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End</label>
              <input
                type="time"
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  formErrors.hour_end ? 'border-red-300' : 'border-gray-300'
                }`}
                value={form.hour_end}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, hour_end: e.target.value }));
                  if (formErrors.hour_end) setFormErrors((prev) => ({ ...prev, hour_end: '' }));
                }}
              />
              {formErrors.hour_end && <p className="mt-1 text-xs text-red-600">{formErrors.hour_end}</p>}
            </div>
          </div>
        </div>

        <SearchSelect
          label="Teacher"
          value={form.teacher_id}
          onChange={handleSelectChange('teacher_id')}
          options={teacherOptions}
          placeholder="Select teacher"
          isLoading={teachersLoading}
          error={formErrors.teacher_id}
        />

        <SearchSelect
          label="Specialization"
          value={form.specialization_id}
          onChange={handleSelectChange('specialization_id')}
          options={specializationOptions}
          placeholder="Select specialization"
          isLoading={specsLoading}
          error={formErrors.specialization_id}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label="Class"
            value={form.class_id}
            onChange={handleSelectChange('class_id')}
            options={classOptions}
            placeholder="Select class"
            isLoading={classesLoading}
            error={formErrors.class_id}
          />
          <SearchSelect
            label="Classroom"
            value={form.class_room_id}
            onChange={handleSelectChange('class_room_id')}
            options={roomOptions}
            placeholder="Select classroom"
            isLoading={roomsLoading}
            error={formErrors.class_room_id}
          />
        </div>

        <SearchSelect
          label="Company"
          value={form.company_id}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, company_id: value === '' ? '' : Number(value) }))
          }
          options={companyOptions}
          placeholder="Optional company"
          isClearable
          isLoading={companiesLoading}
        />

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
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const [state, setState] = useState<PlanningState>({
    data: [],
    loading: false,
    error: null,
    pagination: INITIAL_PAGINATION,
    filters: {
      status: '',
      class_id: '',
      class_room_id: '',
      teacher_id: '',
      specialization_id: '',
      planning_session_type_id: '',
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
    if (f.status) p.status = f.status;
    if (f.class_id) p.class_id = +f.class_id;
    if (f.class_room_id) p.class_room_id = +f.class_room_id;
    if (f.teacher_id) p.teacher_id = +f.teacher_id;
    if (f.specialization_id) p.specialization_id = +f.specialization_id;
    if (f.planning_session_type_id) p.planning_session_type_id = +f.planning_session_type_id;
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
  const { data: companies, isLoading: companiesLoading } = useCompanies({ page: 1, limit: 100 } as any);
  const { data: periods, isLoading: periodsLoading } = useSchoolYearPeriods({ page: 1, limit: 100 } as any);
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

  const classOptions = useMemo(() => mapOptions(classes?.data || [], 'title'), [classes]);
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
  const companyOptions = useMemo(() => mapOptions(companies?.data || [], 'title'), [companies]);
  const periodOptions = useMemo(() => mapOptions(periods?.data || [], 'title'), [periods]);
  const sessionTypeOptions = useMemo(
    () =>
      (sessionTypesResp?.data || []).map((type) => ({
        value: type.id,
        label: type.type ? `${type.title} (${type.type})` : type.title || `Type #${type.id}`,
      })),
    [sessionTypesResp]
  );
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
  const statusFilterOptions = useMemo(() => PLANNING_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label })), []);

  // 🧭 Filter by current week
  const weekEntries = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const startISO = formatISODate(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    end.setHours(23, 59, 59, 999);
    const endISO = formatISODate(end);
    return state.data.filter((e) => e.date_day >= startISO && e.date_day <= endISO);
  }, [state.data, currentWeekStart]);

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
      period: entry.period ?? '',
      date_day: entry.date_day,
      hour_start: normalizeTimeFormat(entry.hour_start),
      hour_end: normalizeTimeFormat(entry.hour_end),
      planning_session_type_id: entry.planning_session_type_id,
      teacher_id: entry.teacher_id ?? '',
      specialization_id: entry.specialization_id ?? '',
      class_id: entry.class_id ?? '',
      class_room_id: entry.class_room_id ?? '',
      company_id: entry.company_id ?? '',
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
          company_id: values.company_id ?? null,
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
    if (!form.period) e.period = 'Period is required';
    if (form.planning_session_type_id === '') e.planning_session_type_id = 'Session type is required';
    if (!form.date_day) e.date_day = 'Date is required';
    if (!form.hour_start) e.hour_start = 'Start time is required';
    if (!form.hour_end) e.hour_end = 'End time is required';
    if (form.hour_start >= form.hour_end) e.hour_end = 'End must be after start';
    if (form.teacher_id === '') e.teacher_id = 'Teacher is required';
    if (form.specialization_id === '') e.specialization_id = 'Specialization is required';
    if (form.class_id === '') e.class_id = 'Class is required';
    if (form.class_room_id === '') e.class_room_id = 'Classroom is required';
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
      company_id: form.company_id === '' ? undefined : +form.company_id,
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
    setForm((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));
    if (formErrors[name as string]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name as string]: '' }));
    }
  }, [formErrors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Class Planning</h1>
            <p className="text-sm text-gray-500">Schedule and manage weekly sessions.</p>
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
      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <SearchSelect
            label="Status"
            value={state.filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            placeholder="All statuses"
            isClearable
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
        </div>
        {state.error && (
          <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700 rounded-md">
            {state.error}
          </div>
        )}
      </div>

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
            classOptions={classOptions}
            roomOptions={roomOptions}
            companyOptions={companyOptions}
            periodOptions={periodOptions}
            sessionTypeOptions={sessionTypeOptions}
            periodsLoading={periodsLoading}
            teachersLoading={teachersLoading}
            specsLoading={specsLoading}
            classesLoading={classesLoading}
            roomsLoading={roomsLoading}
            companiesLoading={companiesLoading}
            sessionTypesLoading={sessionTypesLoading}
            onOpenSessionTypeModal={handleOpenSessionTypeModal}
            isCreatingSessionType={createSessionTypeMut.isPending}
          />
        )}

        <div className="relative">
          <PlanningWeekView
            weekStart={currentWeekStart}
            entries={weekEntries}
            isLoading={state.loading}
            conflictSlot={conflictSlot}
            onPrevWeek={() => handleWeekChange(-7)}
            onNextWeek={() => handleWeekChange(7)}
            onToday={() => setCurrentWeekStart(getMonday(new Date()))}
            onSelectEntry={handleSelectEntry}
            onSelectDate={handleWeekDateSelect}
            getPeriodLabel={getPeriodLabel}
          />
          
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
        companyOptions={companyOptions}
        serverError={sessionTypeModalError}
      />
    </div>
  );
};

export default PlanningSection;
