import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanningStudentEntry, GetPlanningStudentParams } from '../../api/planningStudent';
import type { Course } from '../../api/course';
import type { Teacher } from '../../api/teachers';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import PlanningDuplicationModal from '../modals/PlanningDuplicationModal';
import FrequencyPlaceholderEditor from '../modals/FrequencyPlaceholderEditor';
import { useClasses } from '../../hooks/useClasses';
import { useTeachers } from '../../hooks/useTeachers';
import { useClassRooms } from '../../hooks/useClassRooms';
import { useCourses } from '../../hooks/useCourses';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { usePlanningSessionTypes } from '../../hooks/usePlanningSessionTypes';
import PlanningWeekView from '../planning/PlanningWeekView';
import PlanningMonthView from '../planning/PlanningMonthView';
import PlanningHeader from '../planning/components/PlanningHeader';
import PlanningFiltersBar from '../planning/components/PlanningFiltersBar';
import type { PlanningFilters, PlanningState, PlanningViewMode } from '../planning/types';
import { INITIAL_PAGINATION, formatISODate, getMonday } from '../planning/utils';
import { PLANNING_STATUS_OPTIONS_FORM } from '../../constants/planning';
import type { SearchSelectOption } from '../inputs/SearchSelect';

const PlanningSection: React.FC = () => {
  const { t } = useTranslation();
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
      class_id: '',
      class_room_id: '',
      teacher_id: '',
      planning_session_type_id: '',
      course_id: '',
      school_year_id: '',
      status: 'all',
    },
  });
  const [selectedEntry, setSelectedEntry] = useState<PlanningStudentEntry | null>(null);
  const [showDuplicationModal, setShowDuplicationModal] = useState(false);
  const [showPlaceholderEditor, setShowPlaceholderEditor] = useState(false);
  const [createdPlaceholders, setCreatedPlaceholders] = useState<PlanningStudentEntry[]>([]);

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
        if (!Number.isNaN(statusNum)) p.status = statusNum;
      }
    }
    if (filters.class_id) p.class_id = +filters.class_id;
    if (filters.class_room_id) p.class_room_id = +filters.class_room_id;
    if (filters.teacher_id) p.teacher_id = +filters.teacher_id;
    if (filters.planning_session_type_id) p.planning_session_type_id = +filters.planning_session_type_id;
    if (filters.course_id) p.course_id = +filters.course_id;
    if (filters.school_year_id) p.school_year_id = +filters.school_year_id;
    // Request plannings for the displayed week so the backend returns only that range (avoids empty grid when data is on later pages)
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Monday to Sunday
    p.date_day_from = formatISODate(weekStart);
    p.date_day_to = formatISODate(weekEnd);
    return p;
  }, [state.filters, state.pagination.page, state.pagination.limit, currentWeekStart]);

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

  // Fetch data for filters only (no form)
  const { data: classes, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 });
  const { data: teachers, isLoading: teachersLoading } = useTeachers({ page: 1, limit: 100 });
  const { data: rooms, isLoading: roomsLoading } = useClassRooms({ page: 1, limit: 100 });
  const { data: coursesResp, isLoading: coursesLoading } = useCourses({ page: 1, limit: 100 });
  const { data: schoolYearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 });
  const {
    data: sessionTypesResp,
    isLoading: sessionTypesLoading,
  } = usePlanningSessionTypes({ page: 1, limit: 100, status: 'active' });

  const mapOptions = <T extends { id: number; status?: number; [key: string]: unknown }>(
    data: T[],
    labelKey: string
  ): SearchSelectOption[] =>
    (data || [])
      .filter((item) => item?.status !== -2)
      .map((item) => ({ value: item.id, label: (item[labelKey] as string) || `#${item.id}` }));

  const classOptions = useMemo(() => {
    return mapOptions((classes?.data || []) as unknown as Array<{ id: number; status?: number; title: string; [key: string]: unknown }>, 'title');
  }, [classes]);

  const teacherOptions = useMemo(
    () =>
      (teachers?.data || [])
        .filter((teacher: Teacher) => teacher?.status !== -2)
        .map((teacher: Teacher) => ({
          value: teacher.id,
          label: `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() || teacher.email || `Teacher #${teacher.id}`,
        })),
    [teachers]
  );
  const roomOptions = useMemo(() => mapOptions(rooms?.data || [], 'title'), [rooms]);
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
        .filter((course: Course) => course?.status !== -2)
        .map((course: Course) => ({
          value: course.id,
          label: course.title || `Course #${course.id}`,
        })),
    [coursesResp]
  );

  const yearOptions = useMemo(() => {
    const list = (schoolYearsResp?.data || []) as unknown as Array<{ id: number; status?: number; title: string; [key: string]: unknown }>;
    return mapOptions(list, 'title');
  }, [schoolYearsResp]);

  const getPeriodLabel = useCallback((entry: PlanningStudentEntry) => entry.period ?? '', []);

  const statusFilterOptions = useMemo(
    () => [
      { value: 'all', label: t('sections.allStatuses') },
      ...PLANNING_STATUS_OPTIONS_FORM.map((option) => ({ value: String(option.value), label: option.label })),
    ],
    [t]
  );

  const filtersOptions = useMemo(
    () => ({
      class: classOptions,
      teacher: teacherOptions,
      room: roomOptions,
      sessionType: sessionTypeOptions,
      course: courseOptions,
      year: yearOptions,
      status: statusFilterOptions,
    }),
    [
      classOptions,
      teacherOptions,
      roomOptions,
      sessionTypeOptions,
      courseOptions,
      yearOptions,
      statusFilterOptions,
    ]
  );

  const filtersLoading = useMemo(
    () => ({
      classes: classesLoading,
      teachers: teachersLoading,
      rooms: roomsLoading,
      sessionTypes: sessionTypesLoading,
      courses: coursesLoading,
      years: yearsLoading,
    }),
    [classesLoading, teachersLoading, roomsLoading, sessionTypesLoading, coursesLoading, yearsLoading]
  );

  const weekEntries = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const startISO = formatISODate(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Monday to Sunday (full week, matches PlanningWeekView with Weekend)
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
    setShowDuplicationModal(true);
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

  return (
    <div className="space-y-6">
      <PlanningHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        addPlanningHref="/class-courses"
      />

      <PlanningFiltersBar
        filters={state.filters}
        onFilterChange={handleFilterChange}
        options={filtersOptions}
        loading={filtersLoading}
        error={state.error}
      />

      <div className="min-w-0">
        {viewMode === 'week' ? (
          <PlanningWeekView
            weekStart={currentWeekStart}
            entries={weekEntries}
            isLoading={state.loading}
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
            onPrevMonth={() => handleMonthChange(-1)}
            onNextMonth={() => handleMonthChange(1)}
            onToday={handleToday}
            onSelectEntry={handleSelectEntry}
            onSelectDate={handleMonthDateSelect}
            getPeriodLabel={getPeriodLabel}
          />
        )}
      </div>

      {/* Duplication Modal */}
      {selectedEntry && (
        <PlanningDuplicationModal
          isOpen={showDuplicationModal}
          onClose={() => setShowDuplicationModal(false)}
          planning={selectedEntry}
          onOpenPlaceholderEditor={(placeholders) => {
            setCreatedPlaceholders(placeholders);
            setShowPlaceholderEditor(true);
          }}
          onSuccess={(_createdCount, _plannings, _type, _skippedCount) => {
            planningQuery.refetch();
            setShowDuplicationModal(false);
            setSelectedEntry(null);
          }}
        />
      )}

      {/* Frequency Placeholder Editor */}
      <FrequencyPlaceholderEditor
        isOpen={showPlaceholderEditor}
        onClose={() => {
          setShowPlaceholderEditor(false);
          setCreatedPlaceholders([]);
        }}
        placeholders={createdPlaceholders}
        onSuccess={() => {
          planningQuery.refetch();
        }}
      />
    </div>
  );
};

export default PlanningSection;

