import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import DeleteModal from '../modals/DeleteModal';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import StudentReportDetailModal, { type StudentReportDetailFormValues } from '../modals/StudentReportDetailModal';
import type { StudentReport, StudentReportDashboardStudent } from '../../api/studentReport';
import type { StudentReportDetail, StudentReportDetailStatus } from '../../api/studentReportDetail';
import {
  useCreateStudentReport,
  useUpdateStudentReport,
  useDeleteStudentReport,
} from '../../hooks/useStudentReports';
import { useCreateStudentReportDetail, useUpdateStudentReportDetail } from '../../hooks/useStudentReportDetails';
import { useStudentReportDashboard } from '../../hooks/useStudentReportDashboard';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useClasses } from '../../hooks/useClasses';
import { useStudentsWithoutReport } from '../../hooks/useStudents';
import Report, {
  type StudentCardItem,
  type ReportDetailItem,
  type CoursePresenceRow,
} from '../reportSection/Report';
import type { SortKey } from '../reportSection/types';
import { getFileUrl } from '../../utils/apiConfig';
import { studentReportDetailApi } from '../../api/studentReportDetail';
import CoursesNotesModal from '../reportSection/CoursesNotesModal';
import { PageHeader } from '../ui';
import { FileBarChart } from 'lucide-react';
// Dynamic import for PDF export to reduce initial bundle size
// @react-pdf/renderer is a large library (~2MB), so we only load it when needed

type ErrorWithMessage = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
  message?: unknown;
};

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const responseMessage = (err as ErrorWithMessage).response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(', ');
  if (typeof responseMessage === 'string') return responseMessage;
  const directMessage = (err as ErrorWithMessage).message;
  if (typeof directMessage === 'string') return directMessage;
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  return t('messages.unexpectedError');
};

type StudentLike = {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  picture?: string | null;
};

type TeacherLike = {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type CourseLike = {
  id?: number;
  title?: string | null;
};

const formatStudentName = (student: StudentLike | null | undefined, fallbackId?: number) => {
  const first = student?.first_name ?? '';
  const last = student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (student?.email) return student.email;
  if (fallbackId) return `Student #${fallbackId}`;
  return 'Student';
};

const getAvatarForStudent = (student: StudentLike | null | undefined) => {
  const picture = student?.picture;
  if (picture) {
    return { type: 'image' as const, value: getFileUrl(picture) };
  }
  const first = student?.first_name ?? '';
  const last = student?.last_name ?? '';
  const initials = `${first.slice(0, 1)}${last.slice(0, 1)}`.trim().toUpperCase() || '??';
  return { type: 'initials' as const, value: initials };
};

const formatTeacherName = (teacher: TeacherLike | null | undefined, fallbackId?: number) => {
  const first = teacher?.first_name ?? '';
  const last = teacher?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (teacher?.email) return teacher.email;
  if (fallbackId) return `Teacher #${fallbackId}`;
  return 'Teacher';
};

const formatCourseTitle = (course: CourseLike | null | undefined, fallbackId?: number) => {
  if (course?.title) return course.title;
  if (fallbackId) return `Course #${fallbackId}`;
  return 'Course';
};

type ReportWithDetails = StudentReport & {
  details?: StudentReportDetail[] | null;
  latest_detail?: StudentReportDetail | null;
};

const getReportDetailsFromReport = (report?: StudentReport | null): StudentReportDetail[] => {
  if (!report) return [];
  const extended = report as ReportWithDetails;
  if (Array.isArray(extended.details) && extended.details.length > 0) {
    return extended.details;
  }
  if (extended.latest_detail) return [extended.latest_detail];
  return [];
};

const API_LIMIT = 100;

const StudentReportsSection: React.FC = () => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<StudentReport | null>(null);
  const [modalStudentId, setModalStudentId] = useState<number | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);
  const [detailModalState, setDetailModalState] = useState<{
    reportId: number;
    studentId: number;
    detail?: StudentReportDetail;
  } | null>(null);
  const [detailModalError, setDetailModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentReport | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'student',
    direction: 'asc',
  });
  const [reportDetailsMap, setReportDetailsMap] = useState<Record<number, StudentReportDetail[]>>({});
  const [bulkReportCreating, setBulkReportCreating] = useState(false);
  const [autoDetailCreatingId, setAutoDetailCreatingId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [courseViewerState, setCourseViewerState] = useState<
    { mode: 'all' } | { mode: 'student'; studentId: number; studentName: string } | null
  >(null);

  const { data: yearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 });
  const { data: periodsResp, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: selectedYear ? Number(selectedYear) : undefined,
  });
  const { data: classesResp, isLoading: classesLoading } = useClasses({
    page: 1,
    limit: API_LIMIT,
    school_year_id: selectedYear ? Number(selectedYear) : undefined,
  });
  const dashboardParams = useMemo(() => {
    if (!selectedYear || !selectedClass || !selectedPeriod) return null;
    return {
      class_id: Number(selectedClass),
      school_year_id: Number(selectedYear),
      school_year_period_id: Number(selectedPeriod),
    };
  }, [selectedClass, selectedYear, selectedPeriod]);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useStudentReportDashboard(dashboardParams, { enabled: Boolean(dashboardParams) });

  const createReportMut = useCreateStudentReport();
  const updateReportMut = useUpdateStudentReport();
  const deleteReportMut = useDeleteStudentReport();
  const createReportDetailMut = useCreateStudentReportDetail();
  const updateReportDetailMut = useUpdateStudentReportDetail();
  useEffect(() => {
    setSelectedStudentFilter('');
    setSelectedCourseFilter('');
    setSelectedTeacherFilter('');
    setSelectedStudentId(null); // Clear student selection when filters change
  }, [selectedClass, selectedPeriod, selectedYear]);

  const yearOptions = useMemo<SearchSelectOption[]>(
    () =>
      (yearsResp?.data || []).map((year) => ({
        value: year.id,
        label: year.title || `Year #${year.id}`,
      })),
    [yearsResp]
  );

  const periodOptions = useMemo<SearchSelectOption[]>(
    () =>
      (periodsResp?.data || []).map((period) => ({
        value: period.id,
        label: period.title || `Period #${period.id}`,
      })),
    [periodsResp]
  );

  const classOptions = useMemo<SearchSelectOption[]>(
    () =>
      (classesResp?.data || []).map((cls) => ({
        value: cls.id,
        label: cls.title || `Class #${cls.id}`,
      })),
    [classesResp]
  );

  const classMap = useMemo(() => {
    const map = new Map<number, { title?: string }>();
    (classesResp?.data || []).forEach((cls) => {
      map.set(cls.id, { title: cls.title });
    });
    return map;
  }, [classesResp]);

  const dashboardStudents = useMemo(() => dashboardData?.students || [], [dashboardData]);

  const studentLookup = useMemo(() => {
    const map = new Map<number, StudentReportDashboardStudent>();
    dashboardStudents.forEach((entry) => {
      map.set(entry.student_id, entry);
    });
    return map;
  }, [dashboardStudents]);

  const selectedStudentName = useMemo(() => {
    if (!selectedStudentId) return null;
    const entry = studentLookup.get(selectedStudentId);
    return entry ? formatStudentName(entry.student, entry.student_id) : null;
  }, [selectedStudentId, studentLookup]);

  const studentFilterOptions = useMemo<SearchSelectOption[]>(() => {
    const options = dashboardStudents.map((entry) => ({
      value: entry.student_id,
      label: formatStudentName(entry.student, entry.student_id),
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [dashboardStudents]);

  const courseMap = useMemo(() => {
    const map = new Map<number, CourseLike>();
    (dashboardData?.sessions || []).forEach((session) => {
      const courseId = session.course_id ?? session.course?.id;
      if (!courseId) return;
      map.set(courseId, {
        id: courseId,
        title: session.course?.title ?? map.get(courseId)?.title ?? `Course #${courseId}`,
      });
    });
    (dashboardData?.presences || []).forEach((presence) => {
      const course = presence.studentPlanning?.course;
      const courseId = course?.id ?? presence.studentPlanning?.course_id;
      if (!courseId) return;
      map.set(courseId, {
        id: courseId,
        title: course?.title ?? map.get(courseId)?.title ?? `Course #${courseId}`,
      });
    });
    return map;
  }, [dashboardData]);

  const teacherMap = useMemo(() => {
    const map = new Map<number, TeacherLike>();
    (dashboardData?.sessions || []).forEach((session) => {
      const teacherId = session.teacher_id ?? session.teacher?.id;
      if (!teacherId) return;
      map.set(teacherId, {
        id: teacherId,
        first_name: session.teacher?.first_name ?? map.get(teacherId)?.first_name ?? '',
        last_name: session.teacher?.last_name ?? map.get(teacherId)?.last_name ?? '',
        email: session.teacher?.email ?? map.get(teacherId)?.email,
      });
    });
    (dashboardData?.presences || []).forEach((presence) => {
      const teacher = presence.studentPlanning?.teacher;
      const teacherId = teacher?.id ?? presence.studentPlanning?.teacher_id;
      if (!teacherId) return;
      map.set(teacherId, {
        id: teacherId,
        first_name: teacher?.first_name ?? map.get(teacherId)?.first_name ?? '',
        last_name: teacher?.last_name ?? map.get(teacherId)?.last_name ?? '',
        email: teacher?.email ?? map.get(teacherId)?.email,
      });
    });
    return map;
  }, [dashboardData]);

  const courseFilterOptions = useMemo<SearchSelectOption[]>(() => {
    return Array.from(courseMap.entries())
      .map(([id, course]) => ({
        value: id,
        label: formatCourseTitle(course, id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [courseMap]);

  const teacherFilterOptions = useMemo<SearchSelectOption[]>(() => {
    return Array.from(teacherMap.entries())
      .map(([id, teacher]) => ({
        value: id,
        label: formatTeacherName(teacher, id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teacherMap]);

  const allCourseRows = useMemo<CoursePresenceRow[]>(() => {
    return (dashboardData?.presences || []).map((presence) => {
      const studentEntry = studentLookup.get(presence.student_id);
      const studentInfo = presence.student ?? studentEntry?.student ?? null;
      const studentName = formatStudentName(studentInfo, presence.student_id);
      const studentAvatar = getAvatarForStudent(studentInfo);

      const courseId = presence.studentPlanning?.course_id ?? presence.studentPlanning?.course?.id ?? null;
      const courseMeta = courseId ? courseMap.get(courseId) : null;
      const courseName = formatCourseTitle(presence.studentPlanning?.course ?? courseMeta ?? null, courseId ?? undefined);
      const courseCoefficient =
        (presence.studentPlanning?.course as { coefficient?: number | null } | undefined)?.coefficient ?? null;

      const teacherId = presence.studentPlanning?.teacher_id ?? presence.studentPlanning?.teacher?.id ?? null;
      const teacherMeta = teacherId ? teacherMap.get(teacherId) : null;
      const teacherName = formatTeacherName(presence.studentPlanning?.teacher ?? teacherMeta ?? null, teacherId ?? undefined);

      const noteRaw = presence.note as string | number | null | undefined;
      let noteValue = '';
      let noteNumeric: number | null = null;
      if (typeof noteRaw === 'number') {
        noteValue = noteRaw.toString();
        noteNumeric = noteRaw;
      } else if (typeof noteRaw === 'string') {
        noteValue = noteRaw.trim();
        const parsed = Number(noteValue);
        noteNumeric = Number.isFinite(parsed) ? parsed : null;
      }

      const validateReport = Boolean((presence as { validate_report?: boolean | null }).validate_report);

      return {
        id: presence.id,
        studentId: presence.student_id,
        studentName,
        avatar: studentAvatar,
        teacherName,
        teacherId,
        courseName,
        courseId,
        courseCoefficient,
        note: noteValue || '—',
        noteNumeric,
        validateReport,
      };
    });
  }, [dashboardData?.presences, studentLookup, courseMap, teacherMap]);

  const courseRows = useMemo<CoursePresenceRow[]>(() => {
    return allCourseRows.filter((row) => {
      if (selectedStudentFilter && row.studentId !== Number(selectedStudentFilter)) return false;
      if (selectedCourseFilter && row.courseId !== Number(selectedCourseFilter)) return false;
      if (selectedTeacherFilter && row.teacherId !== Number(selectedTeacherFilter)) return false;
      return true;
    });
  }, [allCourseRows, selectedStudentFilter, selectedCourseFilter, selectedTeacherFilter]);

  const filteredStudents = useMemo(() => {
    if (!selectedStudentFilter) return dashboardStudents;
    const targetId = Number(selectedStudentFilter);
    return dashboardStudents.filter((entry) => entry.student_id === targetId);
  }, [dashboardStudents, selectedStudentFilter]);

  const studentCardItems = useMemo<StudentCardItem[]>(
    () =>
      filteredStudents.map((entry) => ({
        studentId: entry.student_id,
        name: formatStudentName(entry.student, entry.student_id),
        avatar: getAvatarForStudent(entry.student),
        hasReport: Boolean(entry.report),
      })),
    [filteredStudents]
  );

  const reportDetailsItems = useMemo<ReportDetailItem[]>(() => {
    const rows: ReportDetailItem[] = [];

    filteredStudents.forEach((entry) => {
      // Filter by selected student if one is selected
      if (selectedStudentId !== null && entry.student_id !== selectedStudentId) {
        return;
      }

      const studentName = formatStudentName(entry.student, entry.student_id);
      const reportId = entry.report?.id;
      const reportDetails =
        (reportId && reportDetailsMap[reportId]) && reportDetailsMap[reportId]!.length > 0
          ? reportDetailsMap[reportId]!
          : getReportDetailsFromReport(entry.report);

      if (!reportId || reportDetails.length === 0) {
        rows.push({
          studentId: entry.student_id,
          studentName,
          mention: entry.report?.mention ?? null,
          reportId,
          courseName: null,
          teacherName: null,
          note: null,
          hasDetails: false,
        });
        return;
      }

      reportDetails.forEach((detail) => {
        rows.push({
          studentId: entry.student_id,
          detailId: detail.id,
          studentName,
          mention: entry.report?.mention ?? null,
          reportId,
          courseName: formatCourseTitle(detail.course ?? null, detail.course_id ?? detail.course?.id),
          teacherName: formatTeacherName(detail.teacher ?? null, detail.teacher_id ?? detail.teacher?.id),
          note: detail.note ?? null,
          hasDetails: true,
        });
      });
    });

    return rows;
  }, [filteredStudents, reportDetailsMap, selectedStudentId]);

  // Memoize report IDs from filteredStudents to prevent unnecessary effect triggers
  const filteredReportIds = useMemo(() => {
    return filteredStudents.map((entry) => entry.report?.id).filter((id): id is number => id !== undefined && id !== null);
  }, [filteredStudents]);

  useEffect(() => {
    // If a student is selected, fetch details for that student using student_id filter
    if (selectedStudentId !== null) {
      const studentEntry = filteredStudents.find((entry) => entry.student_id === selectedStudentId);
      if (!studentEntry?.report?.id) return;

      const reportId = studentEntry.report.id;
      // Only fetch if we don't have details for this report
      if (reportDetailsMap[reportId]) return;

      let cancelled = false;
      const fetchDetails = async () => {
        try {
          const response = await studentReportDetailApi.getAll({
            student_id: selectedStudentId,
            limit: 100,
          });
          if (cancelled) return;
          setReportDetailsMap((prev) => {
            // Only update if we don't already have the data (prevent race conditions)
            if (prev[reportId]) return prev;
            return {
              ...prev,
              [reportId]: response.data,
            };
          });
        } catch (error) {
          console.error('Failed to fetch report details for student', selectedStudentId, error);
        }
      };

      fetchDetails();
      return () => {
        cancelled = true;
      };
    }

    // Otherwise, fetch for all missing reports (original behavior)
    const missingReportIds = filteredReportIds.filter((id) => !(id in reportDetailsMap));
    if (missingReportIds.length === 0) return;

    let cancelled = false;
    const fetchDetails = async () => {
      const results = await Promise.all(
        missingReportIds.map(async (reportId) => {
          try {
            const response = await studentReportDetailApi.getAll({ student_report_id: reportId, limit: 100 });
            return { reportId, details: response.data };
          } catch (error) {
            console.error('Failed to fetch report details for', reportId, error);
            return { reportId, details: [] as StudentReportDetail[] };
          }
        })
      );
      if (cancelled) return;
      setReportDetailsMap((prev) => {
        const next = { ...prev };
        results.forEach(({ reportId, details }) => {
          // Only update if we don't already have the data (prevent race conditions)
          if (!next[reportId]) {
            next[reportId] = details;
          }
        });
        return next;
      });
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [filteredReportIds, reportDetailsMap, selectedStudentId, filteredStudents]);

  const studentReportMap = useMemo(() => {
    const map = new Map<number, StudentReport | null>();
    filteredStudents.forEach((entry) => {
      map.set(entry.student_id, entry.report ?? null);
    });
    return map;
  }, [filteredStudents]);

  const studentsMissingReports = useMemo(
    () => dashboardStudents.filter((entry) => !entry.report),
    [dashboardStudents]
  );

  const handleOpenReportForStudent = (studentId: number) => {
    const report = studentReportMap.get(studentId) ?? null;
    setEditingReport(report);
    setModalStudentId(studentId);
    setReportModalError(null);
    setReportModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setDetailModalState(null);
    setDetailModalError(null);
  };

  const openDetailModal = (studentId: number, reportId: number, detail?: StudentReportDetail) => {
    setDetailModalState({ studentId, reportId, detail });
    setDetailModalError(null);
  };

  const handleViewReportDetails = async (
    studentId: number,
    reportId: number | undefined,
    detailId?: number
  ) => {
    if (!reportId) return;

    const ensureDetailsInCache = async (): Promise<StudentReportDetail[]> => {
      if (reportDetailsMap[reportId]) return reportDetailsMap[reportId]!;
      try {
        const response = await studentReportDetailApi.getAll({ student_report_id: reportId, limit: 100 });
        setReportDetailsMap((prev) => ({
          ...prev,
          [reportId]: response.data,
        }));
        return response.data;
      } catch (error) {
        console.error('Failed to preload report details', error);
        return [];
      }
    };

    const cachedDetails = await ensureDetailsInCache();
    let targetDetail: StudentReportDetail | undefined =
      detailId !== undefined ? cachedDetails.find((detail) => detail.id === detailId) : cachedDetails[0];

    if (!targetDetail && detailId) {
      try {
        targetDetail = await studentReportDetailApi.getById(detailId);
        setReportDetailsMap((prev) => ({
          ...prev,
          [reportId]: [...(prev[reportId] ?? []), targetDetail!].filter(
            (detail, index, self) => self.findIndex((d) => d.id === detail.id) === index
          ),
        }));
      } catch (error) {
        console.error('Failed to fetch report detail', error);
      }
    }

    openDetailModal(studentId, reportId, targetDetail);
  };

  const sortedCourseRows = useMemo(() => {
    const rows = [...courseRows];
    rows.sort((a, b) => {
      const { key } = sortConfig;
      let comparison = 0;
      if (key === 'student') {
        comparison = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (key === 'teacher') {
        comparison = (a.teacherName || '').localeCompare(b.teacherName || '');
      } else if (key === 'course') {
        comparison = (a.courseName || '').localeCompare(b.courseName || '');
      } else if (key === 'coefficient') {
        const coeffA = a.courseCoefficient ?? 0;
        const coeffB = b.courseCoefficient ?? 0;
        comparison = coeffA - coeffB;
      } else {
        if (a.noteNumeric !== null && b.noteNumeric !== null) {
          comparison = a.noteNumeric - b.noteNumeric;
        } else if (a.noteNumeric !== null) {
          comparison = -1;
        } else if (b.noteNumeric !== null) {
          comparison = 1;
        } else {
          comparison = (a.note || '').localeCompare(b.note || '');
        }
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [courseRows, sortConfig]);

  const coursesByStudent = useMemo(() => {
    const map = new Map<number, CoursePresenceRow[]>();
    allCourseRows.forEach((row) => {
      if (!map.has(row.studentId)) {
        map.set(row.studentId, []);
      }
      map.get(row.studentId)!.push(row);
    });
    return map;
  }, [allCourseRows]);

  const selectedStudentCourses = useMemo(() => {
    if (!selectedStudentId) return [];
    return coursesByStudent.get(selectedStudentId) ?? [];
  }, [coursesByStudent, selectedStudentId]);

  const courseViewerRows = useMemo(() => {
    if (!courseViewerState) return [];
    if (courseViewerState.mode === 'all') return sortedCourseRows;
    return coursesByStudent.get(courseViewerState.studentId) ?? [];
  }, [courseViewerState, sortedCourseRows, coursesByStudent]);

  const courseViewerTitle = useMemo(() => {
    if (!courseViewerState) return 'Courses & notes';
    if (courseViewerState.mode === 'all') return 'Courses & notes';
    return `Courses & notes • ${courseViewerState.studentName}`;
  }, [courseViewerState]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      const defaultDirection = key === 'note' ? 'desc' : 'asc';
      return { key, direction: defaultDirection };
    });
  };

  const handleShowAllCourses = () => {
    if (sortedCourseRows.length === 0) return;
    setCourseViewerState({ mode: 'all' });
  };

  const handleShowSelectedStudentCourses = () => {
    if (!selectedStudentId || !selectedStudentName) return;
    setCourseViewerState({
      mode: 'student',
      studentId: selectedStudentId,
      studentName: selectedStudentName,
    });
  };

  const handleCloseCourseViewer = () => setCourseViewerState(null);

  const totalStudents = dashboardStudents.length;

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const handleReportModalClose = () => {
    setReportModalOpen(false);
    setEditingReport(null);
    setModalStudentId(null);
    setReportModalError(null);
  };

  const handleReportSubmit = async (values: StudentReportFormValues) => {
    const payload = {
      school_year_id: Number(values.school_year_id),
      school_year_period_id: Number(values.school_year_period_id),
      student_id: Number(values.student_id),
      remarks: values.remarks || undefined,
      mention: values.mention || undefined,
      passed: values.passed,
      status: values.status,
    };
    try {
      if (editingReport) {
        await updateReportMut.mutateAsync({ id: editingReport.id, data: payload });
        setAlert({ type: 'success', message: 'Student report updated successfully.' });
      } else {
        const newReport = await createReportMut.mutateAsync(payload);
        
        // Auto-create report details from course/teacher data
        const studentId = Number(values.student_id);
        const studentCourseRows = allCourseRows.filter((row) => row.studentId === studentId);
        
        // Group by unique course_id + teacher_id combinations
        const uniqueCombinations = new Map<string, CoursePresenceRow>();
        studentCourseRows.forEach((row) => {
          if (row.courseId && row.teacherId) {
            const key = `${row.courseId}-${row.teacherId}`;
            // Keep the first occurrence of each unique combination
            if (!uniqueCombinations.has(key)) {
              uniqueCombinations.set(key, row);
            }
          }
        });

        // Create report details for each unique combination
        const detailPromises = Array.from(uniqueCombinations.values()).map((row) => {
          const detailPayload = {
            student_report_id: newReport.id,
            course_id: row.courseId ?? undefined,
            teacher_id: row.teacherId ?? undefined,
            status: 2 as StudentReportDetailStatus,
          };
          return createReportDetailMut.mutateAsync(detailPayload);
        });

        if (detailPromises.length > 0) {
          await Promise.all(detailPromises);
          setAlert({
            type: 'success',
            message: `Student report created successfully with ${detailPromises.length} report detail${detailPromises.length > 1 ? 's' : ''}.`,
          });
        } else {
          setAlert({ type: 'success', message: 'Student report created successfully.' });
        }
      }
      handleReportModalClose();
      refetchDashboard();
    } catch (err: unknown) {
      setReportModalError(extractErrorMessage(err, t));
      throw err;
    }
  };

  const handleDetailSubmit = async (values: StudentReportDetailFormValues) => {
    if (!detailModalState?.reportId) return;
    const teacherId = Number(values.teacher_id);
    const courseId = Number(values.course_id);
    const payload = {
      student_report_id: detailModalState.reportId,
      teacher_id: Number.isNaN(teacherId) ? undefined : teacherId,
      course_id: Number.isNaN(courseId) ? undefined : courseId,
      remarks: values.remarks || undefined,
      note:
        values.note === '' || values.note === null || Number.isNaN(Number(values.note))
          ? undefined
          : Number(values.note),
      status: values.status,
    };
    try {
      let result: StudentReportDetail | null = null;
      if (detailModalState.detail) {
        result = await updateReportDetailMut.mutateAsync({
          id: detailModalState.detail.id,
          data: payload,
        });
        setAlert({ type: 'success', message: 'Report detail updated successfully.' });
      } else {
        result = await createReportDetailMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Report detail added successfully.' });
      }

      if (result) {
        setReportDetailsMap((prev) => {
          const existing = prev[detailModalState.reportId] ?? [];
          let nextList: StudentReportDetail[];
          if (detailModalState.detail) {
            nextList = existing.map((item) => (item.id === result!.id ? result! : item));
          } else {
            nextList = [...existing, result!];
          }
          return {
            ...prev,
            [detailModalState.reportId]: nextList,
          };
        });
      }

      handleDetailModalClose();
      refetchDashboard();
    } catch (err: unknown) {
      setDetailModalError(extractErrorMessage(err, t));
      throw err;
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReportMut.mutateAsync(deleteTarget.id);
      setAlert({ type: 'success', message: 'Student report deleted successfully.' });
      setDeleteTarget(null);
      refetchDashboard();
    } catch (err: unknown) {
      setAlert({ type: 'error', message: extractErrorMessage(err, t) });
    }
  };

  const yearLabel = useMemo(
    () => yearOptions.find((opt) => Number(opt.value) === Number(selectedYear))?.label,
    [yearOptions, selectedYear]
  );
  const periodLabel = useMemo(
    () => periodOptions.find((opt) => Number(opt.value) === Number(selectedPeriod))?.label,
    [periodOptions, selectedPeriod]
  );
  const classLabel = useMemo(() => classMap.get(Number(selectedClass))?.title, [classMap, selectedClass]);

  const modalPresetValues = useMemo(
    () => ({
      school_year_id: selectedYear ? Number(selectedYear) : ('' as const),
      school_year_period_id: selectedPeriod ? Number(selectedPeriod) : ('' as const),
      student_id: modalStudentId ?? ('' as const),
    }),
    [selectedYear, selectedPeriod, modalStudentId]
  );

  // Fetch students without reports when creating a new report
  // Filter by selected year and class (backend doesn't support school_year_period_id filter)
  const studentsWithoutReportParams = useMemo(() => {
    if (!selectedYear) return undefined;
    return {
      school_year_id: Number(selectedYear),
      // Note: school_year_period_id is not supported by backend for this endpoint
      // Backend error: "Unknown column 'c.school_year_period_id' in 'where clause'"
      class_id: selectedClass ? Number(selectedClass) : undefined,
    };
  }, [selectedYear, selectedClass]);

  const { data: studentsWithoutReport } = useStudentsWithoutReport(studentsWithoutReportParams);

  const studentsWithoutReportOptions = useMemo<SearchSelectOption[]>(() => {
    if (!studentsWithoutReport || !Array.isArray(studentsWithoutReport)) return [];
    return studentsWithoutReport.map((student) => ({
      value: student.id,
      label: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `Student #${student.id}`,
    }));
  }, [studentsWithoutReport]);

  // Use students without reports when creating, regular filter options when editing
  const modalStudentOptions = useMemo(() => {
    // When editing (editingReport exists), use the regular student filter options
    // When creating (editingReport is null), use students without reports
    if (editingReport) {
      return studentFilterOptions;
    }
    // When creating, only show students without reports
    // But also include the current student if one is preset (for edge cases)
    const options = [...studentsWithoutReportOptions];
    if (modalStudentId) {
      const currentStudent = studentFilterOptions.find((opt) => Number(opt.value) === modalStudentId);
      if (currentStudent && !options.find((opt) => Number(opt.value) === modalStudentId)) {
        options.push(currentStudent);
      }
    }
    return options;
  }, [editingReport, studentFilterOptions, studentsWithoutReportOptions, modalStudentId]);

  const modalPeriodOptions = useMemo<SearchSelectOption[]>(
    () =>
      selectedPeriod
        ? periodOptions.filter((opt) => Number(opt.value) === Number(selectedPeriod))
        : periodOptions,
    [periodOptions, selectedPeriod]
  );

  const deleteEntityName = useMemo(() => {
    if (!deleteTarget) return undefined;
    const entry = studentLookup.get(deleteTarget.student_id);
    if (entry) return formatStudentName(entry.student, entry.student_id);
    return `Student #${deleteTarget.student_id}`;
  }, [deleteTarget, studentLookup]);

  const handleExportStudentReport = async (studentId: number) => {
    const report = studentReportMap.get(studentId);
    if (!report?.id) {
      setAlert({ type: 'error', message: 'Student must have a report before exporting.' });
      return;
    }

    const studentEntry = studentLookup.get(studentId);
    const studentName = formatStudentName(studentEntry?.student, studentId);

    const ensureDetailsForReport = async (): Promise<StudentReportDetail[]> => {
      if (reportDetailsMap[report.id]) return reportDetailsMap[report.id]!;
      const response = await studentReportDetailApi.getAll({ student_report_id: report.id, limit: 100 });
      setReportDetailsMap((prev) => ({
        ...prev,
        [report.id]: response.data,
      }));
      return response.data;
    };

    try {
      const details = await ensureDetailsForReport();

      const studentCourseRows = coursesByStudent.get(studentId) ?? [];

      const subjects =
        details.length > 0
          ? details.map((detail) => {
              const courseId = detail.course_id ?? detail.course?.id ?? null;
              const matchingCourse = courseId
                ? studentCourseRows.find((row) => row.courseId === courseId)
                : undefined;
              const noteFromCourse = matchingCourse?.note?.trim();
              const noteFallback =
                detail.note === null || detail.note === undefined ? null : String(detail.note);
              return {
                name: formatCourseTitle(detail.course ?? null, courseId ?? undefined) || 'Course',
                studentNote: noteFromCourse || noteFallback || '—',
                classNote:
                  matchingCourse?.courseCoefficient !== null && matchingCourse?.courseCoefficient !== undefined
                    ? `Coeff. ${matchingCourse.courseCoefficient}`
                    : '—',
                appreciation: detail.remarks || '—',
              };
            })
          : [];

      const numericNotes = subjects
        .map((subject) => {
          const parsed = Number(subject.studentNote);
          return Number.isFinite(parsed) ? parsed : null;
        })
        .filter((value): value is number => value !== null);
      const overallAverage =
        numericNotes.length > 0
          ? (numericNotes.reduce((sum, value) => sum + value, 0) / numericNotes.length).toFixed(2)
          : null;

      // Dynamically import PDF export function to reduce initial bundle size
      const { exportStudentReportPdf } = await import('../../utils/exportStudentReportPdf.tsx');
      
      await exportStudentReportPdf({
        studentName,
        studentId: studentEntry?.student?.id ? String(studentEntry.student.id) : String(report.student_id ?? '—'),
        classLabel,
        schoolYearLabel: yearLabel ?? selectedYear ?? undefined,
        periodLabel,
        birthDate: (studentEntry?.student as { birth_date?: string } | undefined)?.birth_date,
        subjects,
        counselorNote: report.remarks ?? undefined,
        principalNote: report.mention ?? undefined,
        overallAverage,
        classAverage: null,
        rank: null,
        absences: undefined,
        tardies: undefined,
      });
      setAlert({ type: 'success', message: `Report exported for ${studentName}.` });
    } catch (error: unknown) {
      console.error('Failed to export student report', error);
      setAlert({ type: 'error', message: extractErrorMessage(error, t) });
    }
  };

  const canShowGrid = Boolean(selectedYear && selectedPeriod && selectedClass);
  const isDashboardLoading = canShowGrid && dashboardLoading;

  const handleCreateReportsForClass = async () => {
    if (!canShowGrid || !selectedYear || !selectedPeriod || dashboardStudents.length === 0) return;
    if (studentsMissingReports.length === 0) {
      setAlert({ type: 'success', message: 'Every student in this class already has a report.' });
      return;
    }
    if (bulkReportCreating) return;

    setBulkReportCreating(true);
    try {
      const payloadBase = {
        school_year_id: Number(selectedYear),
        school_year_period_id: Number(selectedPeriod),
        passed: false,
        status: 2 as StudentReport['status'],
        remarks: undefined,
        mention: undefined,
      };

      let totalDetailsCreated = 0;
      for (const entry of studentsMissingReports) {
        const newReport = await createReportMut.mutateAsync({
          ...payloadBase,
          student_id: entry.student_id,
        });

        // Auto-create report details from course/teacher data
        const studentCourseRows = allCourseRows.filter((row) => row.studentId === entry.student_id);
        
        // Group by unique course_id + teacher_id combinations
        const uniqueCombinations = new Map<string, CoursePresenceRow>();
        studentCourseRows.forEach((row) => {
          if (row.courseId && row.teacherId) {
            const key = `${row.courseId}-${row.teacherId}`;
            // Keep the first occurrence of each unique combination
            if (!uniqueCombinations.has(key)) {
              uniqueCombinations.set(key, row);
            }
          }
        });

        // Create report details for each unique combination
        const detailPromises = Array.from(uniqueCombinations.values()).map((row) => {
          const detailPayload = {
            student_report_id: newReport.id,
            course_id: row.courseId ?? undefined,
            teacher_id: row.teacherId ?? undefined,
            status: 2 as StudentReportDetailStatus,
          };
          return createReportDetailMut.mutateAsync(detailPayload);
        });

        if (detailPromises.length > 0) {
          await Promise.all(detailPromises);
          totalDetailsCreated += detailPromises.length;
        }
      }

      const reportMessage = `Created ${studentsMissingReports.length} student report${
        studentsMissingReports.length > 1 ? 's' : ''
      }`;
      const detailsMessage =
        totalDetailsCreated > 0
          ? ` with ${totalDetailsCreated} report detail${totalDetailsCreated > 1 ? 's' : ''}`
          : '';
      setAlert({
        type: 'success',
        message: `${reportMessage}${detailsMessage}.`,
      });
      await refetchDashboard();
    } catch (err: unknown) {
      setAlert({ type: 'error', message: extractErrorMessage(err, t) });
    } finally {
      setBulkReportCreating(false);
    }
  };

  const handleCreateDetailFromStudentCard = async (studentId: number) => {
    const report = studentReportMap.get(studentId);
    if (!report?.id) return;

    // Toggle selection: if clicking the same student, deselect; otherwise select
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      return;
    }

    // Set selected student to filter report details
    setSelectedStudentId(studentId);

    const reportId = report.id;
    const studentEntry = studentLookup.get(studentId);
    const studentName = formatStudentName(studentEntry?.student, studentId);
    const cachedDetails = reportDetailsMap[reportId] ?? getReportDetailsFromReport(studentEntry?.report ?? report);

    // If student already has details, just set selection and return (don't create)
    if (cachedDetails.length > 0) {
      return;
    }

    if (autoDetailCreatingId !== null) return;

    // Ensure modal is closed before creating
    setDetailModalState(null);
    setDetailModalError(null);
    setAutoDetailCreatingId(studentId);

    try {
      const payload = {
        student_report_id: reportId,
        status: 2 as StudentReportDetailStatus,
      };

      const newDetail = await createReportDetailMut.mutateAsync(payload);

      setReportDetailsMap((prev) => {
        const existing = prev[reportId] ?? [];
        return {
          ...prev,
          [reportId]: [...existing, newDetail],
        };
      });
      // Ensure modal is closed
      setDetailModalState(null);
      setDetailModalError(null);
      setAlert({
        type: 'success',
        message: `Created an empty report detail for ${studentName}. Use the table action to update it.`,
      });
      await refetchDashboard();
    } catch (err: unknown) {
      setAlert({ type: 'error', message: extractErrorMessage(err, t) });
    } finally {
      setAutoDetailCreatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.studentReportsTitle"
        descriptionKey="pages.studentReportsDescription"
        icon={<FileBarChart className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label={t('sidebar.schoolYears')}
          value={selectedYear}
          onChange={(value) => {
            setSelectedYear(value === '' ? '' : String(value));
            setSelectedPeriod('');
            setSelectedClass('');
          }}
          options={yearOptions}
          placeholder={yearsLoading ? t('sections.loadingYears') : t('sections.selectSchoolYear')}
          isClearable
        />
        <SearchSelect
          label={t('sections.period')}
          value={selectedPeriod}
          onChange={(value) => {
            setSelectedPeriod(value === '' ? '' : String(value));
            setSelectedClass('');
          }}
          options={periodOptions}
          placeholder={t('sections.selectPeriod')}
          disabled={!selectedYear || periodsLoading}
          isClearable
        />
        <SearchSelect
          label={t('sidebar.classes')}
          value={selectedClass}
          onChange={(value) => setSelectedClass(value === '' ? '' : String(value))}
          options={classOptions}
          placeholder={t('sections.selectClass')}
          disabled={!selectedPeriod || classesLoading}
          isClearable
        />
      </div>

      {alert && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-success-light bg-success-light text-success-dark'
              : 'border-danger-light bg-danger-light text-danger-dark'
          }`}
        >
          {alert.message}
        </div>
      )}

      {dashboardError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(dashboardError as Error).message}
        </div>
      )}

      {!canShowGrid ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {t('sections.selectSchoolYearToViewReports')}
        </div>
      ) : isDashboardLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          {t('sections.loadingDashboardData')}
        </div>
      ) : totalStudents === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          {t('sections.noStudentsInClass')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchSelect
              label={t('sections.filterByStudent')}
              value={selectedStudentFilter}
              onChange={(value) => setSelectedStudentFilter(value === '' ? '' : String(value))}
              options={studentFilterOptions}
              placeholder={studentFilterOptions.length === 0 ? t('sections.noStudentsAvailable') : t('sections.allStudents')}
              disabled={studentFilterOptions.length === 0}
              isClearable
            />
            <SearchSelect
              label={t('sections.filterByCourse')}
              value={selectedCourseFilter}
              onChange={(value) => setSelectedCourseFilter(value === '' ? '' : String(value))}
              options={courseFilterOptions}
              placeholder={courseFilterOptions.length === 0 ? t('sections.noCoursesAvailable') : t('sections.allCourses')}
              disabled={courseFilterOptions.length === 0}
              isClearable
            />
            <SearchSelect
              label={t('sections.filterByTeacher')}
              value={selectedTeacherFilter}
              onChange={(value) => setSelectedTeacherFilter(value === '' ? '' : String(value))}
              options={teacherFilterOptions}
              placeholder={teacherFilterOptions.length === 0 ? t('sections.noTeachersAvailable') : t('sections.allTeachers')}
              disabled={teacherFilterOptions.length === 0}
              isClearable
            />
          </div>

          <Report
            students={studentCardItems}
            reportDetails={reportDetailsItems}
            onAddReport={handleOpenReportForStudent}
            onCreateReport={handleCreateReportsForClass}
            onViewDetails={handleViewReportDetails}
            onCreateDetailFromStudent={handleCreateDetailFromStudentCard}
            onExportStudentReport={handleExportStudentReport}
            onShowAllCourses={handleShowAllCourses}
            hasCourseData={sortedCourseRows.length > 0}
            isCreateReportLoading={bulkReportCreating}
            disableCreateReport={!canShowGrid || dashboardStudents.length === 0}
            creatingDetailStudentId={autoDetailCreatingId}
            selectedStudentId={selectedStudentId}
            selectedStudentName={selectedStudentName}
            selectedStudentHasCourses={selectedStudentCourses.length > 0}
            onShowSelectedStudentCourses={handleShowSelectedStudentCourses}
          />
        </>
      )}

      <StudentReportModal
        isOpen={reportModalOpen}
        onClose={handleReportModalClose}
        initialData={editingReport ?? undefined}
        onSubmit={handleReportSubmit}
        isSubmitting={createReportMut.isPending || updateReportMut.isPending}
        periodOptions={modalPeriodOptions}
        studentOptions={modalStudentOptions}
        serverError={reportModalError}
        presetValues={modalPresetValues}
        contextInfo={{ year: yearLabel, period: periodLabel, className: classLabel }}
        disableStudentSelect={modalStudentId !== null}
        disablePeriodSelect
      />

      <StudentReportDetailModal
        isOpen={!!detailModalState}
        onClose={handleDetailModalClose}
        initialData={detailModalState?.detail ?? null}
        reportId={detailModalState?.reportId ?? 0}
        onSubmit={handleDetailSubmit}
        isSubmitting={createReportDetailMut.isPending || updateReportDetailMut.isPending}
        teacherOptions={teacherFilterOptions}
        courseOptions={courseFilterOptions}
        serverError={detailModalError}
      />

      <CoursesNotesModal
        isOpen={!!courseViewerState}
        onClose={handleCloseCourseViewer}
        title={courseViewerTitle}
        rows={courseViewerRows}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteReport}
        isLoading={deleteReportMut.isPending}
        title={t('sections.deleteStudentReport')}
        entityName={deleteEntityName}
      />
    </div>
  );
};

export default StudentReportsSection;


