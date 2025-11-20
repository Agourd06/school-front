import React, { useEffect, useMemo, useState } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import DeleteModal from '../modals/DeleteModal';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import type { StudentReport, StudentReportDashboardStudent } from '../../api/studentReport';
import { useCreateStudentReport, useUpdateStudentReport, useDeleteStudentReport } from '../../hooks/useStudentReports';
import { useStudentReportDashboard } from '../../hooks/useStudentReportDashboard';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useClasses } from '../../hooks/useClasses';
import { STATUS_VALUE_LABEL } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-100 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
};

const passedStyles: Record<'passed' | 'failed', string> = {
  passed: 'bg-blue-100 text-blue-700 border border-blue-200',
  failed: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

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

const capitalize = (value?: string | null) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const formatTimeValue = (time?: string | null) => {
  if (!time) return '';
  return time.length > 5 ? time.slice(0, 5) : time;
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
  const [deleteTarget, setDeleteTarget] = useState<StudentReport | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const filteredStudents = useMemo(() => {
    if (!selectedStudentFilter) return dashboardStudents;
    const targetId = Number(selectedStudentFilter);
    return dashboardStudents.filter((entry) => entry.student_id === targetId);
  }, [dashboardStudents, selectedStudentFilter]);

  // Keep for future use when Sessions column is implemented
  const filteredSessions = useMemo(() => {
    let sessions = dashboardData?.sessions || [];
    if (selectedCourseFilter) {
      const courseId = Number(selectedCourseFilter);
      sessions = sessions.filter((session) => (session.course_id ?? session.course?.id) === courseId);
    }
    if (selectedTeacherFilter) {
      const teacherId = Number(selectedTeacherFilter);
      sessions = sessions.filter((session) => (session.teacher_id ?? session.teacher?.id) === teacherId);
    }
    return sessions;
  }, [dashboardData, selectedCourseFilter, selectedTeacherFilter]);

  const filteredPresences = useMemo(() => {
    let presences = dashboardData?.presences || [];
    
    // Apply filters
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
    return presences;
  }, [dashboardData, selectedCourseFilter, selectedStudentFilter, selectedTeacherFilter]);

  // Group presences by student
  const studentsWithPresences = useMemo(() => {
    const studentMap = new Map<number, {
      student_id: number;
      student: StudentLike | null;
      presences: typeof filteredPresences;
    }>();

    filteredPresences.forEach((presence) => {
      const studentId = presence.student_id;
      if (!studentMap.has(studentId)) {
        const studentEntry = studentLookup.get(studentId);
        const studentInfo = presence.student ?? studentEntry?.student ?? null;
        studentMap.set(studentId, {
          student_id: studentId,
          student: studentInfo,
          presences: [],
        });
      }
      studentMap.get(studentId)!.presences.push(presence);
    });

    return Array.from(studentMap.values());
  }, [filteredPresences, studentLookup]);

  const totalStudents = dashboardStudents.length;

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const handleOpenCreateReport = (studentId: number) => {
    setEditingReport(null);
    setModalStudentId(studentId);
    setReportModalError(null);
    setReportModalOpen(true);
  };

  const handleOpenEditReport = (report: StudentReport) => {
    setEditingReport(report);
    setModalStudentId(report.student_id);
    setReportModalError(null);
    setReportModalOpen(true);
  };

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

  const modalStudentOptions = studentFilterOptions;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Student Reports</h1>
          <p className="text-sm text-gray-500">
            Filter by school year, period, and class to manage reports for each student.
          </p>
        </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Students</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    {selectedStudentFilter
                      ? 'No student matches the current filter.'
                      : 'Students will appear here once available.'}
                  </div>
                ) : (
                  filteredStudents.map((entry) => {
                    const studentId = entry.student_id;
                    const studentInfo = entry.student;
                    const avatar = getAvatarForStudent(studentInfo);
                    const displayName = formatStudentName(studentInfo, studentId);
                    const report = entry.report || null;

                    return (
                      <div
                        key={studentId}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {avatar.type === 'image' ? (
                            <img
                              src={avatar.value}
                              alt={displayName}
                              className="h-10 w-10 rounded-full object-cover border border-white shadow"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                              {avatar.value}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-500">Student #{studentId}</p>
                          </div>
                        </div>
                        {report ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${report.passed ? passedStyles.passed : passedStyles.failed}`}>
                                {report.passed ? 'Passed' : 'Not Passed'}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  statusStyles[report.status] ?? 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {STATUS_VALUE_LABEL[report.status] ?? `Status ${report.status}`}
                              </span>
                            </div>
                            <p className="text-gray-600 truncate">
                              <span className="font-medium">Mention:</span> {report.mention || '—'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No report yet. Create one to get started.</p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          {report && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(report)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => (report ? handleOpenEditReport(report) : handleOpenCreateReport(studentId))}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {report ? 'Edit' : 'Create'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Sessions will be displayed here in the future.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Courses And Notes</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {studentsWithPresences.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    {selectedStudentFilter || selectedCourseFilter || selectedTeacherFilter
                      ? 'No students match the selected filters.'
                      : 'No presences or notes recorded yet for this class and period.'}
                  </div>
                ) : (
                  studentsWithPresences.map((studentData) => {
                    const studentAvatar = getAvatarForStudent(studentData.student);
                    const studentName = formatStudentName(studentData.student, studentData.student_id);

                    return (
                      <div key={studentData.student_id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          {studentAvatar.type === 'image' ? (
                            <img
                              src={studentAvatar.value}
                              alt={studentName}
                              className="h-10 w-10 rounded-full object-cover border border-white shadow"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                              {studentAvatar.value}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{studentName}</p>
                            <p className="text-xs text-gray-500">Student #{studentData.student_id}</p>
                          </div>
                        </div>
                        <div className="space-y-2 pl-12">
                          {studentData.presences.map((presence) => {
                            const courseId = presence.studentPlanning?.course_id ?? presence.studentPlanning?.course?.id;
                            const courseMeta = courseId ? courseMap.get(courseId) : null;
                            const courseLabel = formatCourseTitle(
                              presence.studentPlanning?.course ?? courseMeta ?? null,
                              courseId
                            );
                            const teacherId = presence.studentPlanning?.teacher_id ?? presence.studentPlanning?.teacher?.id;
                            const teacherMeta = teacherId ? teacherMap.get(teacherId) : null;
                            const teacherLabel = formatTeacherName(
                              presence.studentPlanning?.teacher ?? teacherMeta ?? null,
                              teacherId
                            );
                            const dateLabel = formatDisplayDate(presence.studentPlanning?.date_day);
                            const timeRange = [formatTimeValue(presence.studentPlanning?.hour_start), formatTimeValue(presence.studentPlanning?.hour_end)]
                              .filter(Boolean)
                              .join(' - ');
                            const presenceStatus = capitalize(presence.presence);
                            const note = typeof presence.note === 'number' && presence.note !== null ? presence.note : null;

                            return (
                              <div key={presence.id} className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900">
                                      <span className="text-gray-500">Course:</span> {courseLabel}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      <span className="text-gray-400">Teacher:</span> {teacherLabel}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                      {presenceStatus && (
                                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                          presenceStatus.toLowerCase() === 'present' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {presenceStatus}
                                        </span>
                                      )}
                                      {note !== null && (
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                          Note: {note}
                                        </span>
                                      )}
                                    </div>
                                    {dateLabel && (
                                      <p className="text-[10px] text-gray-400 mt-1">
                                        <span className="text-gray-300">Date:</span> {[dateLabel, timeRange].filter(Boolean).join(' · ') || 'No schedule info'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
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
        disableStudentSelect
        disablePeriodSelect
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


