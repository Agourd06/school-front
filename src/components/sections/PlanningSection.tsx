import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlanningStudentEntry, GetPlanningStudentParams } from '../../api/planningStudent';
import type { ClassEntity } from '../../api/classes';
import type { Course } from '../../api/course';
import type { GetClassStudentParams } from '../../api/classStudent';
import {
  usePlanningStudents,
  useCreatePlanningStudent,
  useUpdatePlanningStudent,
  useDeletePlanningStudent,
} from '../../hooks/usePlanningStudents';
import { useClasses } from '../../hooks/useClasses';
import { useTeachers } from '../../hooks/useTeachers';
import { useClassRooms } from '../../hooks/useClassRooms';
import { useClassStudents } from '../../hooks/useClassStudents';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useCourses } from '../../hooks/useCourses';
import { usePlanningSessionTypes } from '../../hooks/usePlanningSessionTypes';
import PlanningWeekView from '../planning/PlanningWeekView';
import PlanningMonthView from '../planning/PlanningMonthView';
import PlanningHeader from '../planning/components/PlanningHeader';
import PlanningFiltersBar from '../planning/components/PlanningFiltersBar';
import PlanningForm from '../planning/components/PlanningForm';
import type { PlanningFilters, PlanningState, PlanningViewMode, FormState } from '../planning/types';
import { INITIAL_FORM, INITIAL_PAGINATION, formatISODate, getMonday, normalizeTimeFormat } from '../planning/utils';
import { DEFAULT_PLANNING_STATUS, PLANNING_STATUS_OPTIONS_FORM } from '../../constants/planning';
import type { SearchSelectOption } from '../inputs/SearchSelect';

const PlanningSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<PlanningViewMode>('week');
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

  const params = useMemo(() => {
    const p: GetPlanningStudentParams = {
      page: state.pagination.page,
      limit: state.pagination.limit,
      order: 'ASC',
    };
    const filters = state.filters;
    if (filters.status) {
      if (typeof filters.status === 'number') {
        p.status = filters.status;
      } else if (filters.status !== 'all' && filters.status !== '') {
        const statusNum = Number(filters.status);
        if (!Number.isNaN(statusNum)) p.status = statusNum as any;
      }
    }
    if (filters.class_id) p.class_id = +filters.class_id;
    if (filters.class_room_id) p.class_room_id = +filters.class_room_id;
    if (filters.teacher_id) p.teacher_id = +filters.teacher_id;
    if (filters.specialization_id) p.specialization_id = +filters.specialization_id;
    if (filters.planning_session_type_id) p.planning_session_type_id = +filters.planning_session_type_id;
    if (filters.course_id) p.course_id = +filters.course_id;
    return p;
  }, [state.filters, state.pagination.page, state.pagination.limit]);

  const planningQuery = usePlanningStudents(params);
  const { data: planningResp, isLoading, error } = planningQuery;

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      loading: isLoading,
      error: error ? (error as Error).message : null,
      data: planningResp?.data ?? [],
      pagination: planningResp?.meta ?? INITIAL_PAGINATION,
    }));
  }, [planningResp, isLoading, error]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowForm((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const { data: classes, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 } as any);
  const { data: teachers, isLoading: teachersLoading } = useTeachers({ page: 1, limit: 100 } as any);
  const { data: rooms, isLoading: roomsLoading } = useClassRooms({ page: 1, limit: 100 } as any);
  const { data: specs, isLoading: specsLoading } = useSpecializations({ page: 1, limit: 100 } as any);
  const { data: schoolYears, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 } as any);
  const { data: coursesResp, isLoading: coursesLoading } = useCourses({ page: 1, limit: 100 } as any);
  const { data: periods, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: form.school_year_id === '' ? undefined : Number(form.school_year_id),
  } as any);
  const {
    data: sessionTypesResp,
    isLoading: sessionTypesLoading,
  } = usePlanningSessionTypes({ page: 1, limit: 100, status: 'active' });
  const classStudentsParams = useMemo((): GetClassStudentParams => {
    if (!form.class_id) return {};
    return { class_id: Number(form.class_id), limit: 100 };
  }, [form.class_id]);
  const {
    data: classStudentsResp,
    isLoading: classStudentsLoading,
    error: classStudentsError,
  } = useClassStudents(classStudentsParams);

  const mapOptions = (data: any[], labelKey: string): SearchSelectOption[] =>
    (data || [])
      .filter((item) => item?.status !== -2)
      .map((item) => ({ value: item.id, label: item[labelKey] || `#${item.id}` }));

  const classesMap = useMemo(() => {
    const map = new Map<number, ClassEntity>();
    (classes?.data || []).forEach((cls: ClassEntity) => {
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
      .filter((cls: ClassEntity) => cls.school_year_id === yearId && cls.school_year_period_id === periodId)
      .map((cls: ClassEntity) => ({
        value: cls.id,
        label: cls.title || `Class #${cls.id}`,
      }));
  }, [classes, form.school_year_id, form.period]);

  const teacherOptions = useMemo(
    () =>
      (teachers?.data || [])
        .filter((teacher: any) => teacher?.status !== -2)
        .map((teacher: any) => ({
          value: teacher.id,
          label: `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() || teacher.email || `Teacher #${teacher.id}`,
        })),
    [teachers]
  );
  const roomOptions = useMemo(() => mapOptions(rooms?.data || [], 'title'), [rooms]);
  const specializationOptions = useMemo(() => mapOptions(specs?.data || [], 'title'), [specs]);
  const yearOptions = useMemo(() => mapOptions(schoolYears?.data || [], 'title'), [schoolYears]);
  const periodOptions = useMemo(() => mapOptions(periods?.data || [], 'title'), [periods]);
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

  const classStudents = useMemo(() => classStudentsResp?.data ?? [], [classStudentsResp]);
  const classStudentsErrorMsg = useMemo(() => {
    if (!classStudentsError) return null;
    if (classStudentsError instanceof Error) return classStudentsError.message;
    if (typeof classStudentsError === 'string') return classStudentsError;
    return 'Unable to load students';
  }, [classStudentsError]);

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

  const statusFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      ...PLANNING_STATUS_OPTIONS_FORM.map((option) => ({ value: String(option.value), label: option.label })),
    ],
    []
  );

  const filtersOptions = useMemo(
    () => ({
      status: statusFilterOptions,
      class: classOptions,
      teacher: teacherOptions,
      room: roomOptions,
      specialization: specializationOptions,
      sessionType: sessionTypeOptions,
      course: courseOptions,
    }),
    [
      statusFilterOptions,
      classOptions,
      teacherOptions,
      roomOptions,
      specializationOptions,
      sessionTypeOptions,
      courseOptions,
    ]
  );

  const filtersLoading = useMemo(
    () => ({
      classes: classesLoading,
      teachers: teachersLoading,
      rooms: roomsLoading,
      specs: specsLoading,
      sessionTypes: sessionTypesLoading,
      courses: coursesLoading,
    }),
    [classesLoading, teachersLoading, roomsLoading, specsLoading, sessionTypesLoading, coursesLoading]
  );

  const weekEntries = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const startISO = formatISODate(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    end.setHours(23, 59, 59, 999);
    const endISO = formatISODate(end);

    return state.data.filter((entry) => {
      if (typeof entry.status === 'number' && entry.status === -2) return false;
      return entry.date_day >= startISO && entry.date_day <= endISO;
    });
  }, [state.data, currentWeekStart]);

  const monthEntries = useMemo(() => {
    const year = currentMonthStart.getFullYear();
    const month = currentMonthStart.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startISO = formatISODate(start);
    const endISO = formatISODate(end);

    return state.data.filter((entry) => {
      if (typeof entry.status === 'number' && entry.status === -2) return false;
      return entry.date_day >= startISO && entry.date_day <= endISO;
    });
  }, [state.data, currentMonthStart]);

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

  const createMut = useCreatePlanningStudent();
  const updateMut = useUpdatePlanningStudent();
  const deleteMut = useDeletePlanningStudent();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (form.school_year_id === '') errors.school_year_id = 'School year is required';
    if (!form.period) errors.period = 'Period is required';
    if (!form.date_day) errors.date_day = 'Date is required';
    if (!form.hour_start) errors.hour_start = 'Start time is required';
    if (!form.hour_end) errors.hour_end = 'End time is required';
    if (form.hour_start && form.hour_end && form.hour_start >= form.hour_end) errors.hour_end = 'End must be after start';
    if (form.class_id === '') errors.class_id = 'Class is required';
    if (form.specialization_id === '') errors.specialization_id = 'Specialization is required';
    if (form.teacher_id === '') errors.teacher_id = 'Teacher is required';
    if (form.class_room_id === '') errors.class_room_id = 'Classroom is required';
    if (form.planning_session_type_id === '') errors.planning_session_type_id = 'Session type is required';
    if (form.course_id === '') errors.course_id = 'Course is required';
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const responseMessage = err?.response?.data?.message;
      const msg = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage || err.message || 'Failed to save planning';
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

  const handleSelectChange = useCallback(
    (name: keyof FormState) => (value: number | '' | string) => {
      setForm((prev) => {
        const updated = {
          ...prev,
          [name]: value === '' ? '' : Number(value),
        };

        if (name === 'class_id' && value !== '') {
          const selectedClass = classesMap.get(Number(value));
          if (selectedClass?.specialization_id) {
            updated.specialization_id = selectedClass.specialization_id;
          }
        }

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
    },
    [formErrors, classesMap]
  );

  return (
    <div className="space-y-6">
      <PlanningHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showForm={showForm}
        onToggleForm={() => setShowForm((prev) => !prev)}
      />

      <PlanningFiltersBar
        filters={state.filters}
        onFilterChange={handleFilterChange}
        options={filtersOptions}
        loading={filtersLoading}
        error={state.error}
      />

      <div className={`grid gap-6 ${showForm ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {showForm && (
          <PlanningForm
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
            onOpenSessionTypeModal={undefined}
            isCreatingSessionType={false}
            classDetails={selectedClassDetails}
            courseDetails={selectedCourseDetails}
            classStudents={classStudents}
            classStudentsLoading={classStudentsLoading}
            classStudentsError={classStudentsErrorMsg}
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

    </div>
  );
};

export default PlanningSection;

