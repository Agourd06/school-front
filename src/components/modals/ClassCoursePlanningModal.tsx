import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { Button, Input } from '../ui';
import { useClasses } from '../../hooks/useClasses';
import { useClassRooms } from '../../hooks/useClassRooms';
import { usePlanningSessionTypes } from '../../hooks/usePlanningSessionTypes';
import { useTeachersByCourse } from '../../hooks/useTeacherCourses';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useAllPlanningsInRange, useCreatePlanningStudent } from '../../hooks/usePlanningStudents';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import type { ClassCourse } from '../../api/classCourse';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import { TIME_OPTIONS, formatISODate, getMonday } from '../planning/utils';
import { Calendar } from 'lucide-react';

interface ClassCoursePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCourse: ClassCourse | null;
}

// value: 0=Sun, 1=Mon, ..., 6=Sat — labels come from t('planning.weekday*')
const DAYS_OF_WEEK = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 0 },
];
const WEEKDAY_I18N_SUFFIX: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

/** Normalize date_day to YYYY-MM-DD (API may return ISO string). */
const normalizeDateDay = (dateDay: string | undefined): string => {
  if (!dateDay) return '';
  const s = String(dateDay).trim();
  if (s.length >= 10 && s[4] === '-' && s[7] === '-') return s.slice(0, 10);
  return s;
};

/** Normalize time to HH:mm (API may return HH:mm:ss). */
const normalizeTime = (time: string | undefined): string => {
  if (!time) return '';
  const t = String(time).trim();
  if (t.length >= 5 && t[2] === ':') return t.slice(0, 5);
  return t;
};

/** Format date as YYYY-MM-DD in local time (matches API date_day; avoid UTC shift from toISOString). */
const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const ClassCoursePlanningModal: React.FC<ClassCoursePlanningModalProps> = ({
  isOpen,
  onClose,
  classCourse,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentTeacher } = useTeacherByEmail(user?.email);
  const [form, setForm] = useState({
    class_id: '',
    teacher_id: '',
    school_year_id: '',
    period: '',
    startDate: '',
    endDate: '',
    selectedDays: [] as number[],
    hour_start: '08:00',
    hour_end: '09:00',
    class_room_id: '',
    planning_session_type_id: '',
    has_notes: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSchedules, setCreatedSchedules] = useState<PlanningStudentEntry[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const [showWeekend, setShowWeekend] = useState(false);

  const createMut = useCreatePlanningStudent();

  // ——— Schedule: same as planning page, filters = teacher + class only ———
  // Week range: Monday to Sunday, local calendar dates (match API date_day)
  const weekRangeForApi = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: formatLocalDate(start), to: formatLocalDate(end) };
  }, [currentWeekStart]);

  // GET /api/students-plannings: only teacher_id, class_id, date_day_from, date_day_to (no other filters)
  const scheduleParams = useMemo(() => {
    if (!form.teacher_id || !form.class_id) return null;
    return {
      teacher_id: Number(form.teacher_id),
      class_id: Number(form.class_id),
      date_day_from: weekRangeForApi.from,
      date_day_to: weekRangeForApi.to,
    };
  }, [form.teacher_id, form.class_id, weekRangeForApi.from, weekRangeForApi.to]);

  const shouldFetchSchedules = !!scheduleParams;
  const { data: scheduleSessions, isLoading: scheduleLoading, isFetching: scheduleFetching } = useAllPlanningsInRange(scheduleParams, { enabled: shouldFetchSchedules });

  // Full week (Mon–Sun) for filtering: local calendar dates so they match API date_day
  const fullWeekIsos = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return formatLocalDate(date);
    });
  }, [currentWeekStart]);

  // Displayed week: Mon–Fri or Mon–Sun (columns to show)
  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + (showWeekend ? 6 : 4));
    return end;
  }, [currentWeekStart, showWeekend]);

  const weekDates = useMemo(() => {
    const dayCount = showWeekend ? 7 : 5;
    return Array.from({ length: dayCount }).map((_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return { date, iso: formatLocalDate(date), dayOfWeek: date.getDay() };
    });
  }, [currentWeekStart, showWeekend]);

  // Build schedule blocks: merge created + API, filter by full week (7 days), group by time slot
  const groupedSchedules = useMemo(() => {
    if (!shouldFetchSchedules) return [];
    const weekDateSet = new Set(fullWeekIsos);
    const all = [...createdSchedules, ...(scheduleSessions ?? [])];
    const inWeek = all.filter((e) => weekDateSet.has(normalizeDateDay(e.date_day)));
    const byKey = new Map<string, PlanningStudentEntry[]>();
    inWeek.forEach((e) => {
      const key = `${normalizeTime(e.hour_start)}-${normalizeTime(e.hour_end)}-${e.class_id}-${e.teacher_id}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(e);
    });
    return Array.from(byKey.entries()).map(([, entries]) => {
      const first = entries[0];
      const days = [...new Set(entries.map((e) => {
        const iso = normalizeDateDay(e.date_day);
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).getDay();
      }))].sort();
      const isNew = entries.some((e) => createdSchedules.some((c) => c.id === e.id));
      return { ...first, days, isNew, allEntries: entries };
    });
  }, [createdSchedules, scheduleSessions, shouldFetchSchedules, fullWeekIsos]);

  // Debug: log every move (only references vars defined above to avoid "before initialization" error)
  useEffect(() => {
    const tag = '[ClassCoursePlanningModal Schedule]';
    console.log(tag, '1. Filters', {
      teacher_id: form.teacher_id || '(empty)',
      class_id: form.class_id || '(empty)',
      scheduleParams: scheduleParams ?? '(null – need both teacher and class)',
    });
    console.log(tag, '2. Fetch', {
      shouldFetchSchedules,
      scheduleLoading,
      scheduleFetching,
      apiSessionsCount: scheduleSessions?.length ?? 0,
      apiSessionsSample: (scheduleSessions ?? []).slice(0, 3).map((s) => ({
        id: s.id,
        date_day: s.date_day,
        hour_start: s.hour_start,
        hour_end: s.hour_end,
        class_id: s.class_id,
        teacher_id: s.teacher_id,
      })),
    });
    const weekDateSet = new Set(fullWeekIsos);
    const all = [...createdSchedules, ...(scheduleSessions ?? [])];
    const inWeek = all.filter((e) => weekDateSet.has(normalizeDateDay(e.date_day)));
    console.log(tag, '3. Week & merge', {
      weekRangeForApi,
      fullWeekIsos,
      createdCount: createdSchedules.length,
      totalMerged: all.length,
      inWeekCount: inWeek.length,
      inWeekSample: inWeek.slice(0, 2).map((e) => ({ date_day: normalizeDateDay(e.date_day), hour_start: e.hour_start })),
    });
    console.log(tag, '4. Grouped blocks', {
      groupedCount: groupedSchedules.length,
      groups: groupedSchedules.map((g) => ({
        days: g.days,
        time: `${normalizeTime(g.hour_start)}-${normalizeTime(g.hour_end)}`,
        entriesCount: g.allEntries?.length ?? 0,
      })),
    });
  }, [
    form.teacher_id,
    form.class_id,
    scheduleParams,
    shouldFetchSchedules,
    scheduleLoading,
    scheduleFetching,
    scheduleSessions,
    weekRangeForApi,
    fullWeekIsos,
    createdSchedules,
    groupedSchedules,
  ]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return getMonday(next);
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return getMonday(next);
    });
  };

  const handleToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const handleWeekDateSelect = (isoDate: string) => {
    if (!isoDate) return;
    const selected = new Date(isoDate);
    if (Number.isNaN(selected.getTime())) return;
    setCurrentWeekStart(getMonday(selected));
  };

  // Get level from class course
  const levelId = classCourse?.level_id;
  const level = classCourse?.level;
  const courseId = classCourse?.course_id;

  // Fetch school years (ongoing/planned only)
  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 });
  const schoolYears = useMemo(() => {
    return (schoolYearsResp?.data || []).filter(
      (year: { lifecycle_status?: string }) =>
        year.lifecycle_status === 'ongoing' || year.lifecycle_status === 'planned'
    );
  }, [schoolYearsResp]);

  // Fetch periods for selected school year
  // Note: The hook only fetches when schoolYearId is provided
  // Use the same pattern as PlanningSection: convert string to number or undefined
  const { data: periodsResp, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: form.school_year_id === '' ? undefined : Number(form.school_year_id),
  });

  // Fetch classes filtered by level and selected school year
  const { data: classesResp } = useClasses({
    page: 1,
    limit: 100,
    level_id: levelId,
    school_year_id: form.school_year_id === '' ? undefined : Number(form.school_year_id),
  });

  // Fetch teachers for the course using the new endpoint
  const { data: teachersForCourse, isLoading: teachersLoading } = useTeachersByCourse(courseId, {
    enabled: !!courseId,
  });

  const { data: classRoomsResp, isLoading: roomsLoading } = useClassRooms({ page: 1, limit: 100 });
  const { data: sessionTypesResp, isLoading: sessionTypesLoading } = usePlanningSessionTypes({
    page: 1,
    limit: 100,
    status: 'active',
  });

  const schoolYearOptions = useMemo<SearchSelectOption[]>(
    () => schoolYears.map((year) => ({ value: year.id, label: year.title })),
    [schoolYears]
  );

  const periodOptions = useMemo<SearchSelectOption[]>(() => {
    if (!form.school_year_id || !periodsResp?.data) return [];
    return (periodsResp.data || []).map((period) => {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      const dateRange = period.start_date && period.end_date
        ? ` (${formatDate(period.start_date)} - ${formatDate(period.end_date)})`
        : '';
      
      return {
        value: period.id,
        label: `${period.title}${dateRange}`,
      };
    });
  }, [periodsResp, form.school_year_id]);

  const classOptions = useMemo<SearchSelectOption[]>(
    () => (classesResp?.data || []).map((cls) => ({ value: cls.id, label: cls.title })),
    [classesResp]
  );

  const teacherOptions = useMemo<SearchSelectOption[]>(
    () =>
      (teachersForCourse || []).map((teacher) => {
        const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
        return {
          value: teacher.id,
          label: name || teacher.email || `Teacher #${teacher.id}`,
        };
      }),
    [teachersForCourse]
  );

  const roomOptions = useMemo<SearchSelectOption[]>(
    () => (classRoomsResp?.data || []).map((room) => ({ value: room.id, label: room.title })),
    [classRoomsResp]
  );

  const sessionTypeOptions = useMemo<SearchSelectOption[]>(
    () =>
      (sessionTypesResp?.data || []).map((type) => ({
        value: type.id,
        label: type.title,
      })),
    [sessionTypesResp]
  );

  const timeOptions = useMemo<SearchSelectOption[]>(
    () => TIME_OPTIONS.map((time) => ({ value: time, label: time })),
    []
  );

  const endTimeOptions = useMemo<SearchSelectOption[]>(() => {
    if (!form.hour_start) return timeOptions;
    const startTime = form.hour_start;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    return timeOptions.filter((option) => {
      const [endHour, endMinute] = String(option.value).split(':').map(Number);
      const endMinutes = endHour * 60 + endMinute;
      return endMinutes > startMinutes; // End time must be after start time
    });
  }, [form.hour_start, timeOptions]);

  useEffect(() => {
    if (isOpen && classCourse) {
      // Reset form when modal opens
      setForm({
        class_id: '',
        teacher_id: '',
        school_year_id: '',
        period: '',
        startDate: '',
        endDate: '',
        selectedDays: [],
        hour_start: '08:00',
        hour_end: '09:00',
        class_room_id: '',
        planning_session_type_id: '',
        has_notes: true,
      });
      setErrors({});
      setCreatedSchedules([]); // Reset created schedules when modal opens
      setCurrentWeekStart(getMonday(new Date())); // Reset to current week
      setShowWeekend(false); // Reset weekend visibility
    }
  }, [isOpen, classCourse]);

  // When a teacher opens the modal, pre-fill their teacher_id so they see their sessions immediately
  useEffect(() => {
    if (isOpen && classCourse && currentTeacher && !form.teacher_id) {
      setForm((prev) => ({ ...prev, teacher_id: String(currentTeacher.id) }));
    }
  }, [isOpen, classCourse, currentTeacher, form.teacher_id]);

  // Get selected period for date validation
  const selectedPeriod = useMemo(() => {
    if (!form.period || !periodsResp?.data) return null;
    return periodsResp.data.find((p) => p.id === Number(form.period));
  }, [form.period, periodsResp]);

  // Reset period when school year changes
  useEffect(() => {
    if (form.school_year_id) {
      setForm((prev) => {
        if (prev.period) {
          return { ...prev, period: '', startDate: '', endDate: '' };
        }
        return prev;
      });
    }
  }, [form.school_year_id]);

  // Reset dates when period changes if they're outside the new period range
  useEffect(() => {
    if (selectedPeriod && (form.startDate || form.endDate)) {
      setForm((prev) => {
        let updated = { ...prev };
        if (prev.startDate && (prev.startDate < selectedPeriod.start_date || prev.startDate > selectedPeriod.end_date)) {
          updated.startDate = '';
        }
        if (prev.endDate && (prev.endDate < selectedPeriod.start_date || prev.endDate > selectedPeriod.end_date)) {
          updated.endDate = '';
        }
        return updated;
      });
    }
  }, [selectedPeriod, form.startDate, form.endDate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.class_id) newErrors.class_id = t('forms.classRequired') || 'Class is required';
    if (!form.teacher_id) newErrors.teacher_id = t('forms.teacherRequired') || 'Teacher is required';
    if (!form.school_year_id) {
      newErrors.school_year_id = t('forms.schoolYearRequired') || 'School year is required';
    }
    if (!form.period) {
      newErrors.period = t('forms.periodRequired') || 'Period is required';
    }
    if (!form.startDate) newErrors.startDate = t('forms.startDateRequired') || 'Start date is required';
    if (!form.endDate) newErrors.endDate = t('forms.endDateRequired') || 'End date is required';
    if (form.selectedDays.length === 0)
      newErrors.selectedDays = t('forms.daysRequired') || 'At least one day must be selected';
    if (!form.hour_start) newErrors.hour_start = t('forms.startTimeRequired') || 'Start time is required';
    if (!form.hour_end) newErrors.hour_end = t('forms.endTimeRequired') || 'End time is required';
    if (!form.class_room_id) newErrors.class_room_id = t('forms.classRoomRequired') || 'Classroom is required';
    if (!form.planning_session_type_id)
      newErrors.planning_session_type_id = t('forms.sessionTypeRequired') || 'Session type is required';

    // Validate dates are within period range
    if (selectedPeriod && form.startDate) {
      if (form.startDate < selectedPeriod.start_date) {
        newErrors.startDate = t('forms.startDateMustBeWithinPeriod') || `Start date must be between ${selectedPeriod.start_date} and ${selectedPeriod.end_date}`;
      }
      if (form.startDate > selectedPeriod.end_date) {
        newErrors.startDate = t('forms.startDateMustBeWithinPeriod') || `Start date must be between ${selectedPeriod.start_date} and ${selectedPeriod.end_date}`;
      }
    }

    if (selectedPeriod && form.endDate) {
      if (form.endDate < selectedPeriod.start_date) {
        newErrors.endDate = t('forms.endDateMustBeWithinPeriod') || `End date must be between ${selectedPeriod.start_date} and ${selectedPeriod.end_date}`;
      }
      if (form.endDate > selectedPeriod.end_date) {
        newErrors.endDate = t('forms.endDateMustBeWithinPeriod') || `End date must be between ${selectedPeriod.start_date} and ${selectedPeriod.end_date}`;
      }
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = t('forms.endDateMustBeAfterStartDate') || 'End date must be after start date';
    }

    if (form.hour_start && form.hour_end && form.hour_start >= form.hour_end) {
      newErrors.hour_end = t('forms.endTimeMustBeAfterStartTime') || 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateDates = (startDate: string, endDate: string, selectedDays: number[]): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include end date

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(formatISODate(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !classCourse) return;

    setIsSubmitting(true);
    try {
      const dates = generateDates(form.startDate, form.endDate, form.selectedDays);
      
      // Get period title
      const selectedPeriodObj = (periodsResp?.data || []).find((p) => p.id === Number(form.period));
      const periodTitle = selectedPeriodObj?.title || form.period;

      // Create planning entries for each date
      const promises = dates.map((date) =>
        createMut.mutateAsync({
          period: periodTitle,
          date_day: date,
          hour_start: form.hour_start,
          hour_end: form.hour_end,
          teacher_id: Number(form.teacher_id),
          class_id: Number(form.class_id),
          course_id: courseId!,
          school_year_id: form.school_year_id ? Number(form.school_year_id) : undefined,
          class_course_id: classCourse?.id ?? undefined,
          status: 2, // Pending
          class_room_id: Number(form.class_room_id),
          planning_session_type_id: Number(form.planning_session_type_id),
          has_notes: form.has_notes,
        })
      );

      const createdEntries = await Promise.all(promises);
      
      setCreatedSchedules((prev) => [...prev, ...createdEntries]);
      
      // Show the week that contains the first created date so the new session is visible
      if (createdEntries.length > 0 && createdEntries[0].date_day) {
        const firstIso = normalizeDateDay(createdEntries[0].date_day);
        const [y, m, d] = firstIso.split('-').map(Number);
        const firstDate = new Date(y, m - 1, d);
        if (!Number.isNaN(firstDate.getTime())) {
          setCurrentWeekStart(getMonday(firstDate));
        }
      }
      
      // Reset only schedule-specific fields (days, times)
      setForm((prev) => ({
        ...prev,
        selectedDays: [],
        hour_start: '08:00',
        hour_end: '09:00',
      }));
      
      // Clear schedule-related errors
      setErrors((prev) => {
        const { selectedDays, hour_start, hour_end, submit, ...rest } = prev;
        return rest;
      });
      
      // Don't close the form - keep it open for adding more schedules
    } catch (error: unknown) {
      console.error('Error creating planning entries:', error);
      
      // Extract the actual error message from the API response
      const axiosError = error as { 
        response?: { 
          data?: { 
            message?: string | string[];
            statusCode?: number;
          };
        }; 
        message?: string;
      };
      
      const dataMessage = axiosError?.response?.data?.message;
      
      // Handle both string and array message formats
      let errorMessage: string;
      if (Array.isArray(dataMessage)) {
        errorMessage = dataMessage.join(', ');
      } else if (typeof dataMessage === 'string' && dataMessage.trim()) {
        errorMessage = dataMessage;
      } else if (typeof axiosError.message === 'string' && axiosError.message.trim()) {
        errorMessage = axiosError.message;
      } else {
        errorMessage = t('messages.errorOccurred') || 'An error occurred';
      }
      
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
    if (errors.selectedDays) {
      setErrors((prev) => ({ ...prev, selectedDays: '' }));
    }
  };

  if (!classCourse) return null;

  const courseName = classCourse.course?.title || `Course #${classCourse.course_id}`;
  const programName = level?.specialization?.program?.title || '—';
  const specializationName = level?.specialization?.title || '—';
  const levelName = level?.title || '—';
  const moduleName = classCourse.module?.title || '—';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('forms.addToPlanning') || 'Add to Planning'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only Course Information - path style, spaced across full width */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-evenly gap-x-2 gap-y-2 text-sm text-gray-900">
            <span>
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('sidebar.programs')}:</span>{' '}
              <span className="font-semibold">{programName}</span>
            </span>
            <span className="text-muted">/</span>
            <span>
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('dashboard.specializations')}:</span>{' '}
              <span className="font-semibold">{specializationName}</span>
            </span>
            <span className="text-muted">/</span>
            <span>
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('sidebar.levels')}:</span>{' '}
              <span className="font-semibold text-primary">{levelName}</span>
            </span>
            <span className="text-muted">/</span>
            <span>
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('sidebar.modules')}:</span>{' '}
              <span className="font-semibold">{moduleName}</span>
            </span>
            <span className="text-muted">/</span>
            <span>
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('sidebar.courses')}:</span>{' '}
              <span className="font-semibold text-primary">{courseName}</span>
            </span>
          </div>
        </div>

        {/* School Year and Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label={`${t('sidebar.schoolYears')} *`}
            value={form.school_year_id}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, school_year_id: String(value), period: '' }));
              if (errors.school_year_id) setErrors((prev) => ({ ...prev, school_year_id: '' }));
            }}
            options={schoolYearOptions}
            placeholder={t('forms.selectSchoolYear') || 'Select school year'}
            error={errors.school_year_id}
          />

          <SearchSelect
            label={`${t('sidebar.periods')} *`}
            value={form.period}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, period: String(value) }));
              if (errors.period) setErrors((prev) => ({ ...prev, period: '' }));
            }}
            options={periodOptions}
            placeholder={
              !form.school_year_id
                ? t('forms.selectSchoolYearFirst') || 'Select school year first'
                : periodsLoading
                ? t('common.loading') || 'Loading periods...'
                : periodOptions.length === 0
                ? t('forms.noPeriodsFound') || 'No periods found for this school year'
                : t('forms.selectPeriod') || 'Select period'
            }
            disabled={!form.school_year_id || periodsLoading || periodOptions.length === 0}
            error={errors.period}
          />
        </div>

        {/* Dynamic Selections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label={`${t('sidebar.classes')} *`}
            value={form.class_id}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, class_id: String(value) }));
              if (errors.class_id) setErrors((prev) => ({ ...prev, class_id: '' }));
            }}
            options={classOptions}
            placeholder={
              !form.school_year_id
                ? t('forms.selectSchoolYearFirst') || 'Select school year first'
                : !levelId
                ? t('forms.levelRequired') || 'Level is required'
                : classOptions.length === 0
                ? t('forms.noClassesFound') || 'No classes found for this level and school year'
                : t('forms.selectClass') || 'Select a class'
            }
            disabled={!form.school_year_id || !levelId || classOptions.length === 0}
            error={errors.class_id}
          />

          <SearchSelect
            label={`${t('sidebar.teachers')} *`}
            value={form.teacher_id}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, teacher_id: String(value) }));
              if (errors.teacher_id) setErrors((prev) => ({ ...prev, teacher_id: '' }));
            }}
            options={teacherOptions}
            placeholder={
              !courseId
                ? t('forms.courseRequired') || 'Course is required'
                : teachersLoading
                ? t('common.loading') || 'Loading teachers...'
                : teacherOptions.length === 0
                ? t('forms.noTeachersForCourse') || 'No teachers assigned to this course'
                : t('forms.selectTeacher') || 'Select a teacher'
            }
            disabled={!courseId || teacherOptions.length === 0 || teachersLoading}
            error={errors.teacher_id}
          />
        </div>

        {/* Classroom and Session Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label={`${t('sidebar.classRooms')} *`}
            value={form.class_room_id}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, class_room_id: String(value) }));
              if (errors.class_room_id) setErrors((prev) => ({ ...prev, class_room_id: '' }));
            }}
            options={roomOptions}
            placeholder={
              roomsLoading
                ? t('common.loading') || 'Loading...'
                : roomOptions.length === 0
                ? t('forms.noClassroomsFound') || 'No classrooms found'
                : t('forms.selectClassroom') || 'Select classroom'
            }
            isLoading={roomsLoading}
            error={errors.class_room_id}
          />

          <div>
            <SearchSelect
              label={`${t('sections.sessionType')} *`}
              value={form.planning_session_type_id}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, planning_session_type_id: String(value) }));
                if (errors.planning_session_type_id)
                  setErrors((prev) => ({ ...prev, planning_session_type_id: '' }));
              }}
              options={sessionTypeOptions}
              placeholder={
                sessionTypesLoading
                  ? t('common.loading') || 'Loading...'
                  : sessionTypeOptions.length === 0
                  ? t('forms.noSessionTypesFound') || 'No session types found'
                  : t('forms.selectSessionType') || 'Select session type'
              }
              isLoading={sessionTypesLoading}
              error={errors.planning_session_type_id}
            />
            <p className="mt-1 text-xs text-muted">
              {t('forms.toCreateAType')}{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/settings/types/planning');
                }}
                className="font-medium text-secondary hover:text-secondary/80 underline cursor-pointer transition-colors"
              >
                {t('forms.settings')}
              </button>
              {' > '}{t('forms.types')}{' > '}{t('forms.planningSessionTypes')}
            </p>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('forms.startDate')} *`}
            type="date"
            value={form.startDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              setForm((prev) => {
                // If end date is before new start date, reset it
                const updated = { ...prev, startDate: newStartDate };
                if (prev.endDate && newStartDate > prev.endDate) {
                  updated.endDate = '';
                }
                return updated;
              });
              if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
            }}
            min={selectedPeriod?.start_date || undefined}
            max={selectedPeriod?.end_date || undefined}
            error={errors.startDate}
            disabled={!selectedPeriod}
          />

          <Input
            label={`${t('forms.endDate')} *`}
            type="date"
            value={form.endDate}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, endDate: e.target.value }));
              if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
            }}
            min={selectedPeriod?.start_date && form.startDate ? (form.startDate > selectedPeriod.start_date ? form.startDate : selectedPeriod.start_date) : selectedPeriod?.start_date || undefined}
            max={selectedPeriod?.end_date || undefined}
            error={errors.endDate}
            disabled={!selectedPeriod}
          />
        </div>

        {/* Days of Week + Start Hour + End Hour - one row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-body mb-2">
              {t('forms.daysOfWeek')} * <span className="text-xs text-gray-500">({t('forms.selectOneOrMore')})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    form.selectedDays.includes(day.value)
                      ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={form.selectedDays.includes(day.value)}
                >
                  {t(`planning.weekday${WEEKDAY_I18N_SUFFIX[day.value]}`)}
                </button>
              ))}
            </div>
            {errors.selectedDays && <p className="mt-1 text-xs text-red-600">{errors.selectedDays}</p>}
          </div>

          <SearchSelect
            label={`${t('sections.startHour')} *`}
            value={form.hour_start}
            onChange={(value) => {
              setForm((prev) => ({
                ...prev,
                hour_start: String(value),
                hour_end: prev.hour_end && String(value) >= prev.hour_end ? '' : prev.hour_end,
              }));
              if (errors.hour_start) setErrors((prev) => ({ ...prev, hour_start: '' }));
              if (errors.hour_end) setErrors((prev) => ({ ...prev, hour_end: '' }));
            }}
            options={timeOptions}
            placeholder={t('forms.startTime')}
            error={errors.hour_start}
          />

          <SearchSelect
            label={`${t('sections.endHour')} *`}
            value={form.hour_end}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, hour_end: String(value) }));
              if (errors.hour_end) setErrors((prev) => ({ ...prev, hour_end: '' }));
            }}
            options={endTimeOptions}
            placeholder={form.hour_start ? t('forms.endTime') : t('forms.selectStartTimeFirst')}
            disabled={!form.hour_start}
            error={errors.hour_end}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_notes"
              checked={form.has_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, has_notes: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              aria-describedby="has_notes_description"
            />
            <label htmlFor="has_notes" className="text-sm font-medium text-gray-700 cursor-pointer">
              {t('forms.sessionHasNotes')}
            </label>
          </div>
          <p id="has_notes_description" className="text-xs text-gray-500 -mt-1 ml-6">
            {t('forms.sessionHasNotesDescription')}
          </p>
        </div>

        {/* Weekly Schedule Calendar Display */}
        {shouldFetchSchedules && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('planning.schedules') || 'Schedules'}
              </h3>
              
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={formatISODate(currentWeekStart)}
                    onChange={(e) => handleWeekDateSelect(e.target.value)}
                    className="pl-9 pr-2 py-1.5 text-xs border-2 border-orange-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                    aria-label="Jump to week"
                  />
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {t('planning.prev')}
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {t('planning.today')}
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {t('planning.next')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWeekend(!showWeekend)}
                  className={`px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md transition-colors whitespace-nowrap ${
                    showWeekend
                      ? 'bg-primary text-white border-primary hover:bg-primary/90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={t('planning.weekend')}
                >
                  {t('planning.weekend')}
                </button>
              </div>
            </div>
            
            {/* Week Range Display */}
            <p className="text-xs text-muted mb-4">
              {currentWeekStart.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })} – {weekEnd.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            
            {/* Weekly Calendar Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className={`grid ${showWeekend ? 'grid-cols-7' : 'grid-cols-5'} divide-x divide-gray-200`}>
                {weekDates.map((weekDate) => {
                  const dayInfo = DAYS_OF_WEEK.find((d) => d.value === weekDate.dayOfWeek);
                  if (!dayInfo) return null;
                  
                  // Find all schedules for this specific date
                  const daySchedules = groupedSchedules.filter((schedule) => {
                    return schedule.allEntries?.some((entry) => normalizeDateDay(entry.date_day) === weekDate.iso) || false;
                  });
                  
                  return (
                    <div key={weekDate.iso} className="p-3 min-h-[200px]">
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {t(`planning.weekday${WEEKDAY_I18N_SUFFIX[weekDate.dayOfWeek]}`)}
                        </span>
                        <span className="text-xs text-muted ml-1">
                          {weekDate.date.getDate()}/{weekDate.date.getMonth() + 1}
                        </span>
                      </div>
                      
                      {daySchedules.length === 0 ? (
                        <div className="text-sm text-muted text-center py-8">
                          {t('planning.noSessions')}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {daySchedules.map((schedule, index) => {
                            const isNew = schedule.isNew;
                            const blockBgClass = isNew
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200';
                            const textColorClass = isNew ? 'text-blue-900' : 'text-gray-700';
                            const mutedColorClass = isNew ? 'text-blue-700' : 'text-muted';
                            
                            return (
                              <div
                                key={`schedule-${schedule.id || index}-${weekDate.iso}-${schedule.hour_start}-${schedule.hour_end}`}
                                className={`border rounded-lg px-3 py-2.5 shadow-sm ${blockBgClass}`}
                              >
                                <div className="space-y-1">
                                  <div className={`font-semibold text-sm ${textColorClass}`}>
                                    {normalizeTime(schedule.hour_start)} - {normalizeTime(schedule.hour_end)}
                                  </div>
                                  <div className={`text-sm font-medium ${textColorClass}`}>
                                    {schedule.course?.title || schedule.classCourse?.title || schedule.period}
                                  </div>
                                  <div className={`text-xs ${mutedColorClass}`}>
                                    {schedule.planningSessionType?.title || `${t('planning.typeNumber')}${schedule.planning_session_type_id || 'null'}`}
                                  </div>
                                  {schedule.teacher && (
                                    <div className={`text-xs ${mutedColorClass} truncate`}>
                                      {schedule.teacher.first_name} {schedule.teacher.last_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-tertiary/20">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {t('forms.addToPlanning') || 'Add to Planning'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClassCoursePlanningModal;
