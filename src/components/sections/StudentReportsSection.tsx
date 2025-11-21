import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import DeleteModal from '../modals/DeleteModal';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import BaseModal from '../modals/BaseModal';
import type { StudentReport, StudentReportDashboardStudent } from '../../api/studentReport';
import type { Student as ApiStudent } from '../../api/students';
import { studentsApi } from '../../api/students';
import { useCreateStudentReport, useUpdateStudentReport, useDeleteStudentReport } from '../../hooks/useStudentReports';
import { useStudentReportDashboard } from '../../hooks/useStudentReportDashboard';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useClasses } from '../../hooks/useClasses';
import { getFileUrl } from '../../utils/apiConfig';

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

type SortKey = 'student' | 'teacher' | 'course' | 'note' | 'coefficient';

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

const StudentDetailsButton: React.FC<{ studentId?: number }> = ({ studentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: () => studentsApi.getDetails(Number(studentId)),
    enabled: Boolean(isOpen && studentId),
    staleTime: 60_000,
  });

  const student = data?.student as ApiStudent | undefined;
  const diploma = data?.diploma;
  const contact = data?.contact;
  const linkType = data?.linkType ?? contact?.studentLinkType;

  const handleOpen = () => {
    if (!studentId) return;
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!studentId}
        className="p-2 rounded-full text-gray-500 transition-colors hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="View student details"
      >
        <Eye className="h-4 w-4" />
      </button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          student
            ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
              student.email ||
              'Student details'
            : 'Student details'
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading student details…</div>
        ) : error ? (
          <div className="py-2 text-sm text-red-600">Failed to load student details. Please try again.</div>
        ) : (
          <div className="space-y-5">
            {student && (
              <section className="space-y-2">
                <div className="flex items-center gap-3">
                  {student.picture && (
                    <img
                      src={getFileUrl(student.picture)}
                      alt={student.first_name ?? student.email ?? 'student'}
                      className="h-14 w-14 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
                        student.email ||
                        `#${student.id}`}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Nationality</p>
                    <p className="text-gray-900">{student.nationality || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Birthday</p>
                    <p className="text-gray-900">{student.birthday || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">City</p>
                    <p className="text-gray-900">{student.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Country</p>
                    <p className="text-gray-900">{student.country || '—'}</p>
                  </div>
                </div>
              </section>
            )}

            {diploma && (
              <section className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gradient-to-br from-white to-blue-50/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-500">Academic Record</p>
                    <h4 className="text-lg font-semibold text-gray-900 mt-1">{diploma.title || 'Diploma'}</h4>
                  </div>
                  <span className="text-xs rounded-full bg-blue-100 px-3 py-0.5 text-blue-700 font-semibold">
                    {diploma.status === 1 ? 'Active' : diploma.status === -1 ? 'Archived' : 'Draft'}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                    <p>
                      <span className="text-gray-500">Diploma:</span> {diploma.diplome || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">School:</span> {diploma.school || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">Year:</span> {diploma.annee || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span> {diploma.status ?? '—'}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Location:</span>{' '}
                      {[diploma.city, diploma.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {diploma.diplome_picture_1 || diploma.diplome_picture_2 ? (
                      <>
                        {diploma.diplome_picture_1 && (
                          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  src: getFileUrl(diploma.diplome_picture_1!),
                                  label: `${diploma.title || 'Diploma'} – picture 1`,
                                })
                              }
                              className="w-full"
                            >
                              <img
                                className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                                src={getFileUrl(diploma.diplome_picture_1)}
                                alt="Diploma picture 1"
                              />
                            </button>
                          </div>
                        )}
                        {diploma.diplome_picture_2 && (
                          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  src: getFileUrl(diploma.diplome_picture_2!),
                                  label: `${diploma.title || 'Diploma'} – picture 2`,
                                })
                              }
                              className="w-full"
                            >
                              <img
                                className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                                src={getFileUrl(diploma.diplome_picture_2)}
                                alt="Diploma picture 2"
                              />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500">
                        No diploma images uploaded.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {contact && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {contact.status === 1 ? 'Active' : contact.status === -1 ? 'Archived' : 'Draft'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>
                    <span className="text-gray-500">Name:</span>{' '}
                    {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Birthday:</span> {contact.birthday || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span> {contact.email || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span> {contact.phone || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Address:</span> {contact.adress || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">City:</span> {contact.city || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Country:</span> {contact.country || '—'}
                  </p>
                </div>
              </section>
            )}

            {linkType && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Link Type</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {linkType.status === 1 ? 'Active' : linkType.status === 0 ? 'Disabled' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Title:</span> {linkType.title || '—'}
                </p>
                {linkType.student_id && (
                  <p className="text-xs text-gray-500">Linked student ID: {linkType.student_id}</p>
                )}
              </section>
            )}

            {!student && !diploma && !contact && (
              <p className="text-sm text-gray-500">No details available for this student.</p>
            )}
          </div>
        )}
      </BaseModal>

      <BaseModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.label || 'Diploma preview'}>
        {preview && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview.src}
              alt={preview.label}
              className="max-h-[70vh] w-full object-contain rounded-2xl border bg-white"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Close Preview
            </button>
          </div>
        )}
      </BaseModal>
    </>
  );
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
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'student',
    direction: 'asc',
  });

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

  const presenceCards = useMemo(() => {
    return filteredPresences.map((presence) => {
      const studentEntry = studentLookup.get(presence.student_id);
      const studentInfo = presence.student ?? studentEntry?.student ?? null;
      const studentName = formatStudentName(studentInfo, presence.student_id);
      const studentAvatar = getAvatarForStudent(studentInfo);

      const courseId = presence.studentPlanning?.course_id ?? presence.studentPlanning?.course?.id;
      const courseMeta = courseId ? courseMap.get(courseId) : null;
      const courseName = formatCourseTitle(presence.studentPlanning?.course ?? courseMeta ?? null, courseId);
      const courseCoefficient = (presence.studentPlanning?.course as { coefficient?: number | null } | undefined)?.coefficient ?? null;

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
  }, [filteredPresences, studentLookup, courseMap, teacherMap]);

  const sortedPresenceCards = useMemo(() => {
    const cards = [...presenceCards];
    cards.sort((a, b) => {
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
    return cards;
  }, [presenceCards, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      const defaultDirection = key === 'note' ? 'desc' : 'asc';
      return { key, direction: defaultDirection };
    });
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return (
      <svg className="h-3 w-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 5l4 4H6l4-4zm0 10l-4-4h8l-4 4z" />
      </svg>
    );
    return sortConfig.direction === 'asc' ? (
      <svg className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 5l4 4H6l4-4z" />
      </svg>
    ) : (
      <svg className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 15l-4-4h8l-4 4z" />
      </svg>
    );
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

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_0.7fr_1.4fr] gap-6">
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

                    return (
                      <div
                        key={studentId}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
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
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        </div>
                        <StudentDetailsButton studentId={studentId} />
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
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                {presenceCards.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    {selectedStudentFilter || selectedCourseFilter || selectedTeacherFilter
                      ? 'No records match the selected filters.'
                      : 'No presences or notes recorded yet for this class and period.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-[11px]">
                      <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSort('student')}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              Student
                              {renderSortIndicator('student')}
                            </button>
                          </th>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSort('teacher')}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              Teacher
                              {renderSortIndicator('teacher')}
                            </button>
                          </th>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSort('course')}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              Course
                              {renderSortIndicator('course')}
                            </button>
                          </th>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSort('coefficient')}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              Coefficient
                              {renderSortIndicator('coefficient')}
                            </button>
                          </th>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSort('note')}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                            >
                              Note
                              {renderSortIndicator('note')}
                            </button>
                          </th>
                          <th scope="col" className="px-4 py-2 text-left font-semibold">
                            Validation
                          </th>
                          <th scope="col" className="px-4 py-2 text-center font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedPresenceCards.map((entry) => (
                          <tr
                            key={entry.id}
                            className={`text-gray-800 ${entry.validateReport ? 'bg-green-50' : 'bg-gray-50'}`}
                          >
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {entry.avatar.type === 'image' ? (
                                  <img
                                    src={entry.avatar.value}
                                    alt={entry.studentName}
                                    className="h-7 w-7 rounded-full object-cover border border-white shadow"
                                  />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold">
                                    {entry.avatar.value}
                                  </div>
                                )}
                                <span className="font-medium truncate max-w-[140px]">{entry.studentName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-600 truncate max-w-[130px]">{entry.teacherName}</td>
                            <td className="px-4 py-2 text-gray-600 truncate max-w-[180px]">{entry.courseName}</td>
                            <td className="px-4 py-2 text-gray-600 truncate max-w-[100px]">
                              {entry.courseCoefficient !== null ? entry.courseCoefficient : '—'}
                            </td>
                            <td className="px-4 py-2 text-gray-600 truncate max-w-[120px]">{entry.note}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  entry.validateReport ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {entry.validateReport ? 'Validated' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <StudentDetailsButton studentId={entry.studentId} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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


