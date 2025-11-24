import React, { useEffect, useMemo, useState } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import DeleteModal from '../modals/DeleteModal';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import StudentReportDetailModal, { type StudentReportDetailFormValues } from '../modals/StudentReportDetailModal';
import ReportDetailsViewerModal from '../reportSection/ReportDetailsViewerModal';
import type { StudentReport, StudentReportDashboardStudent } from '../../api/studentReport';
import type { StudentReportDetail } from '../../api/studentReportDetail';
import {
  useCreateStudentReport,
  useUpdateStudentReport,
  useDeleteStudentReport,
} from '../../hooks/useStudentReports';
import {
  useCreateStudentReportDetail,
  useUpdateStudentReportDetail,
  useStudentReportDetails,
} from '../../hooks/useStudentReportDetails';
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

type ErrorWithMessage = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
  message?: unknown;
};

const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'Unexpected error';
  const responseMessage = (err as ErrorWithMessage).response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(', ');
  if (typeof responseMessage === 'string') return responseMessage;
  const directMessage = (err as ErrorWithMessage).message;
  if (typeof directMessage === 'string') return directMessage;
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  return 'Unexpected error';
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
  const [detailViewerState, setDetailViewerState] = useState<{
    reportId: number;
    studentId: number;
    studentName: string;
  } | null>(null);
  const [detailModalError, setDetailModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentReport | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'student',
    direction: 'asc',
  });
  const [reportDetailsMap, setReportDetailsMap] = useState<Record<number, StudentReportDetail[]>>({});

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
    school_year_period_id: selectedPeriod ? Number(selectedPeriod) : undefined,
  });
  const dashboardParams = useMemo(() => {
    if (!selectedYear || !selectedPeriod || !selectedClass) return null;
    return {
      class_id: Number(selectedClass),
      school_year_id: Number(selectedYear),
      school_year_period_id: Number(selectedPeriod),
    };
  }, [selectedClass, selectedPeriod, selectedYear]);

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
  const {
    data: reportDetailsData,
    isLoading: reportDetailsLoading,
    refetch: refetchReportDetails,
  } = useStudentReportDetails(
    detailViewerState?.reportId
      ? { student_report_id: detailViewerState.reportId, limit: 100 }
      : { limit: 0 },
    { enabled: !!detailViewerState?.reportId }
  );
  const reportDetailEntries = useMemo(() => reportDetailsData?.data ?? [], [reportDetailsData?.data]);

  useEffect(() => {
    setSelectedStudentFilter('');
    setSelectedCourseFilter('');
    setSelectedTeacherFilter('');
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

  const courseRows = useMemo<CoursePresenceRow[]>(() => {
    let presences = dashboardData?.presences || [];

    if (selectedStudentFilter) {
      const studentId = Number(selectedStudentFilter);
      presences = presences.filter((presence) => presence.student_id === studentId);
    }
    if (selectedCourseFilter) {
      const courseId = Number(selectedCourseFilter);
      presences = presences.filter((presence) => {
        const planningCourseId = presence.studentPlanning?.course_id ?? presence.studentPlanning?.course?.id;
        return planningCourseId === courseId;
      });
    }
    if (selectedTeacherFilter) {
      const teacherId = Number(selectedTeacherFilter);
      presences = presences.filter((presence) => {
        const planningTeacherId = presence.studentPlanning?.teacher_id ?? presence.studentPlanning?.teacher?.id;
        return planningTeacherId === teacherId;
      });
    }

    return presences.map((presence) => {
      const studentEntry = studentLookup.get(presence.student_id);
      const studentInfo = presence.student ?? studentEntry?.student ?? null;
      const studentName = formatStudentName(studentInfo, presence.student_id);
      const studentAvatar = getAvatarForStudent(studentInfo);

      const courseId = presence.studentPlanning?.course_id ?? presence.studentPlanning?.course?.id;
      const courseMeta = courseId ? courseMap.get(courseId) : null;
      const courseName = formatCourseTitle(presence.studentPlanning?.course ?? courseMeta ?? null, courseId);
      const courseCoefficient =
        (presence.studentPlanning?.course as { coefficient?: number | null } | undefined)?.coefficient ?? null;

      const teacherId = presence.studentPlanning?.teacher_id ?? presence.studentPlanning?.teacher?.id;
      const teacherMeta = teacherId ? teacherMap.get(teacherId) : null;
      const teacherName = formatTeacherName(presence.studentPlanning?.teacher ?? teacherMeta ?? null, teacherId);

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
        teacherName,
        courseName,
        courseCoefficient,
        avatar: studentAvatar,
        note: noteValue || '—',
        noteNumeric,
        validateReport,
      };
    });
  }, [
    dashboardData?.presences,
    selectedStudentFilter,
    selectedCourseFilter,
    selectedTeacherFilter,
    studentLookup,
    courseMap,
    teacherMap,
  ]);

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
          courseName: formatCourseTitle(detail.course ?? null, detail.course_id),
          teacherName: formatTeacherName(detail.teacher ?? null, detail.teacher_id),
          note: detail.note ?? null,
          hasDetails: true,
        });
      });
    });

    return rows;
  }, [filteredStudents, reportDetailsMap]);

  useEffect(() => {
    const missingReportIds = filteredStudents
      .map((entry) => entry.report?.id)
      .filter((id): id is number => id !== undefined && id !== null && !(id in reportDetailsMap));
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
          next[reportId] = details;
        });
        return next;
      });
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [filteredStudents, reportDetailsMap]);

  useEffect(() => {
    if (!detailViewerState?.reportId || reportDetailsLoading) return;
    setReportDetailsMap((prev) => ({
      ...prev,
      [detailViewerState.reportId!]: reportDetailEntries,
    }));
  }, [detailViewerState, reportDetailEntries, reportDetailsLoading]);

  const studentReportMap = useMemo(() => {
    const map = new Map<number, StudentReport | null>();
    filteredStudents.forEach((entry) => {
      map.set(entry.student_id, entry.report ?? null);
    });
    return map;
  }, [filteredStudents]);

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

  const handleViewReportDetails = (studentId: number, reportId: number | undefined, studentName: string) => {
    if (!reportId) return;
    setDetailViewerState({ studentId, reportId, studentName });
  };

  const handleDetailViewerClose = () => {
    setDetailViewerState(null);
  };

  const handleDetailModalFromViewer = () => {
    if (!detailViewerState) return;
    setDetailModalState({ studentId: detailViewerState.studentId, reportId: detailViewerState.reportId });
    setDetailModalError(null);
    setDetailViewerState(null);
  };

  const handleDetailEditFromViewer = (detail: StudentReportDetail) => {
    setDetailModalState((prev) => ({
      studentId: detailViewerState?.studentId ?? prev?.studentId ?? detail.student_report_id,
      reportId: detail.student_report_id,
      detail,
    }));
    setDetailModalError(null);
    setDetailViewerState(null);
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

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      const defaultDirection = key === 'note' ? 'desc' : 'asc';
      return { key, direction: defaultDirection };
    });
  };

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
        await createReportMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Student report created successfully.' });
      }
      handleReportModalClose();
      refetchDashboard();
    } catch (err: unknown) {
      setReportModalError(extractErrorMessage(err));
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
        if (Number.isNaN(teacherId) || Number.isNaN(courseId)) {
          throw new Error('Teacher and course are required');
        }
        result = await createReportDetailMut.mutateAsync({
          student_report_id: detailModalState.reportId,
          teacher_id: teacherId,
          course_id: courseId,
          remarks: payload.remarks,
          note: payload.note,
          status: payload.status,
        });
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
      if (detailViewerState) {
        refetchReportDetails();
      }
    } catch (err: unknown) {
      setDetailModalError(extractErrorMessage(err));
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
      setAlert({ type: 'error', message: extractErrorMessage(err) });
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
  // Filter by selected year, period, and class
  const studentsWithoutReportParams = useMemo(() => {
    if (!selectedYear || !selectedPeriod) return undefined;
    return {
      school_year_id: Number(selectedYear),
      school_year_period_id: Number(selectedPeriod),
      class_id: selectedClass ? Number(selectedClass) : undefined,
    };
  }, [selectedYear, selectedPeriod, selectedClass]);

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

  const canShowGrid = Boolean(selectedYear && selectedPeriod && selectedClass);
  const isDashboardLoading = canShowGrid && dashboardLoading;

  const handleCreateReportFromHeader = () => {
    if (!canShowGrid || dashboardStudents.length === 0) return;
    setEditingReport(null);
    setModalStudentId(null);
    setReportModalError(null);
    setReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Student Reports</h1>
        <p className="text-sm text-gray-500">
          Filter by school year, period, and class to manage reports for each student.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label="School Year"
          value={selectedYear}
          onChange={(value) => {
            setSelectedYear(value === '' ? '' : String(value));
            setSelectedPeriod('');
            setSelectedClass('');
          }}
          options={yearOptions}
          placeholder={yearsLoading ? 'Loading years…' : 'Select school year'}
          isClearable
        />
        <SearchSelect
          label="Period"
          value={selectedPeriod}
          onChange={(value) => {
            setSelectedPeriod(value === '' ? '' : String(value));
            setSelectedClass('');
          }}
          options={periodOptions}
          placeholder="Select period"
          disabled={!selectedYear || periodsLoading}
          isClearable
        />
        <SearchSelect
          label="Class"
          value={selectedClass}
          onChange={(value) => setSelectedClass(value === '' ? '' : String(value))}
          options={classOptions}
          placeholder="Select class"
          disabled={!selectedPeriod || classesLoading}
          isClearable
        />
      </div>

      {alert && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
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
          Select a school year, period, and class to view student reports.
        </div>
      ) : isDashboardLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading dashboard data…
        </div>
      ) : totalStudents === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No students are registered in this class.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchSelect
              label="Filter by student"
              value={selectedStudentFilter}
              onChange={(value) => setSelectedStudentFilter(value === '' ? '' : String(value))}
              options={studentFilterOptions}
              placeholder={studentFilterOptions.length === 0 ? 'No students available' : 'All students'}
              disabled={studentFilterOptions.length === 0}
              isClearable
            />
            <SearchSelect
              label="Filter by course"
              value={selectedCourseFilter}
              onChange={(value) => setSelectedCourseFilter(value === '' ? '' : String(value))}
              options={courseFilterOptions}
              placeholder={courseFilterOptions.length === 0 ? 'No courses available' : 'All courses'}
              disabled={courseFilterOptions.length === 0}
              isClearable
            />
            <SearchSelect
              label="Filter by teacher"
              value={selectedTeacherFilter}
              onChange={(value) => setSelectedTeacherFilter(value === '' ? '' : String(value))}
              options={teacherFilterOptions}
              placeholder={teacherFilterOptions.length === 0 ? 'No teachers available' : 'All teachers'}
              disabled={teacherFilterOptions.length === 0}
              isClearable
            />
          </div>

          <Report
            students={studentCardItems}
            reportDetails={reportDetailsItems}
            courses={sortedCourseRows}
            sortConfig={sortConfig}
            onSort={handleSort}
            onAddReport={handleOpenReportForStudent}
            onCreateReport={handleCreateReportFromHeader}
            onViewDetails={handleViewReportDetails}
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
        onViewReportDetails={(studentId) => {
          const report = studentReportMap.get(studentId);
          const studentEntry = studentLookup.get(studentId);
          if (report?.id) {
            handleViewReportDetails(studentId, report.id, formatStudentName(studentEntry?.student, studentId));
          }
        }}
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

      <ReportDetailsViewerModal
        isOpen={!!detailViewerState}
        onClose={handleDetailViewerClose}
        studentName={detailViewerState?.studentName ?? ''}
        details={reportDetailEntries}
        isLoading={reportDetailsLoading}
        onAddDetail={handleDetailModalFromViewer}
        onEditDetail={handleDetailEditFromViewer}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteReport}
        isLoading={deleteReportMut.isPending}
        title="Delete Student Report"
        entityName={deleteEntityName}
      />
    </div>
  );
};

export default StudentReportsSection;


