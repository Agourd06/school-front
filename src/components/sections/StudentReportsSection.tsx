import React, { useEffect, useMemo, useState } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import DeleteModal from '../modals/DeleteModal';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import StudentReportDetailModal, { type StudentReportDetailFormValues } from '../modals/StudentReportDetailModal';
import type { StudentReport } from '../../api/studentReport';
import type { ClassStudentAssignment } from '../../api/classStudent';
import type { StudentReportDetail } from '../../api/studentReportDetail';
import { useStudentReports, useCreateStudentReport, useUpdateStudentReport, useDeleteStudentReport } from '../../hooks/useStudentReports';
import { useStudentReportDetails, useCreateStudentReportDetail, useUpdateStudentReportDetail, useDeleteStudentReportDetail } from '../../hooks/useStudentReportDetails';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useClasses } from '../../hooks/useClasses';
import { useClassStudents } from '../../hooks/useClassStudents';
import { useTeachers } from '../../hooks/useTeachers';
import { useCourses } from '../../hooks/useCourses';
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

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const formatAssignmentStudent = (assignment: ClassStudentAssignment) => {
  const student = assignment.student;
  const first = student?.first_name ?? '';
  const last = student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || student?.email || `Student #${assignment.student_id}`;
};

const getAvatarForStudent = (assignment: ClassStudentAssignment) => {
  const picture = assignment.student?.picture;
  if (picture) {
    return { type: 'image' as const, value: getFileUrl(picture) };
  }
  const first = assignment.student?.first_name ?? '';
  const last = assignment.student?.last_name ?? '';
  const initials = `${first.slice(0, 1)}${last.slice(0, 1)}`.trim().toUpperCase() || '??';
  return { type: 'initials' as const, value: initials };
};

const API_LIMIT = 100;

const StudentReportsSection: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<StudentReport | null>(null);
  const [modalStudentId, setModalStudentId] = useState<number | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentReport | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<StudentReportDetail | null>(null);
  const [selectedReportIdForDetail, setSelectedReportIdForDetail] = useState<number | null>(null);
  const [deleteDetailTarget, setDeleteDetailTarget] = useState<StudentReportDetail | null>(null);
  const [detailModalError, setDetailModalError] = useState<string | null>(null);

  const { data: yearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 } as any);
  const { data: periodsResp, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: selectedYear ? Number(selectedYear) : undefined,
  } as any);
  const { data: classesResp, isLoading: classesLoading } = useClasses({
    page: 1,
    limit: API_LIMIT,
    school_year_id: selectedYear ? Number(selectedYear) : undefined,
    school_year_period_id: selectedPeriod ? Number(selectedPeriod) : undefined,
  } as any);
  const {
    data: classStudentsResp,
    isLoading: classStudentsLoading,
    error: classStudentsError,
  } = useClassStudents(
    selectedClass ? { class_id: Number(selectedClass), limit: API_LIMIT } : {}
  );

  const reportParams = useMemo(
    () => ({
      page: 1,
      limit: API_LIMIT,
      school_year_id: selectedYear ? Number(selectedYear) : undefined,
      school_year_period_id: selectedPeriod ? Number(selectedPeriod) : undefined,
    }),
    [selectedYear, selectedPeriod]
  );

  const {
    data: reportsResp,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useStudentReports(reportParams);

  const createReportMut = useCreateStudentReport();
  const updateReportMut = useUpdateStudentReport();
  const deleteReportMut = useDeleteStudentReport();
  const createDetailMut = useCreateStudentReportDetail();
  const updateDetailMut = useUpdateStudentReportDetail();
  const deleteDetailMut = useDeleteStudentReportDetail();

  const { data: teachersResp } = useTeachers({ page: 1, limit: API_LIMIT } as any);
  const { data: coursesResp } = useCourses({ page: 1, limit: API_LIMIT } as any);

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

  const classStudents = useMemo(() => {
    const safeAssignments = (classStudentsResp?.data || [])
      .filter(
        (assignment) =>
          assignment.student_id &&
          assignment.status !== -2 &&
          assignment.student?.status !== -2
      )
      .map((assignment) => {
        const student = assignment.student;
        const hasData =
          Boolean(student) &&
          [
            student?.first_name,
            student?.last_name,
            student?.email,
            student?.picture,
          ].some((value) => value && String(value).trim().length > 0);

        if (hasData) return assignment;

        return {
          ...assignment,
          student: {
            id: assignment.student_id,
            first_name: 'Student',
            last_name: `#${assignment.student_id}`,
            email: student?.email ?? null,
            status: student?.status ?? 1,
            picture: student?.picture ?? null,
          },
        };
      });

    return safeAssignments.filter((assignment) => Boolean(assignment.student)) as ClassStudentAssignment[];
  }, [classStudentsResp]);

  const reportsByStudentId = useMemo(() => {
    const map = new Map<number, StudentReport>();
    (reportsResp?.data || []).forEach((report) => {
      if (report.student_id) {
        map.set(report.student_id, report);
      }
    });
    return map;
  }, [reportsResp]);

  const reportIds = useMemo(() => {
    return (reportsResp?.data || []).map((r) => r.id).filter((id): id is number => !!id);
  }, [reportsResp]);

  // Fetch all report details - we'll filter client-side by report IDs
  const { data: allDetailsResp, refetch: refetchDetails } = useStudentReportDetails(
    {
      page: 1,
      limit: API_LIMIT,
    },
    { enabled: reportIds.length > 0 }
  );

  const detailsByStudentId = useMemo(() => {
    const map = new Map<number, StudentReportDetail[]>();
    const allDetails = allDetailsResp?.data || [];
    const reportIdSet = new Set(reportIds);

    allDetails.forEach((detail) => {
      if (reportIdSet.has(detail.student_report_id)) {
        const report = reportsResp?.data?.find((r) => r.id === detail.student_report_id);
        if (report?.student_id) {
          const existing = map.get(report.student_id) || [];
          map.set(report.student_id, [...existing, detail]);
        }
      }
    });

    return map;
  }, [allDetailsResp, reportIds, reportsResp]);

  const teacherOptions = useMemo<SearchSelectOption[]>(
    () =>
      (teachersResp?.data || []).map((teacher: any) => ({
        value: teacher.id,
        label:
          `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() ||
          teacher.email ||
          `Teacher #${teacher.id}`,
      })),
    [teachersResp]
  );

  const courseOptions = useMemo<SearchSelectOption[]>(
    () =>
      (coursesResp?.data || []).map((course: any) => ({
        value: course.id,
        label: course.title || `Course #${course.id}`,
      })),
    [coursesResp]
  );

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
      refetchReports();
    } catch (err: any) {
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
      refetchReports();
    } catch (err: any) {
      setAlert({ type: 'error', message: extractErrorMessage(err) });
    }
  };

  const handleOpenCreateDetail = (reportId: number) => {
    setEditingDetail(null);
    setSelectedReportIdForDetail(reportId);
    setDetailModalError(null);
    setDetailModalOpen(true);
  };

  const handleOpenEditDetail = (detail: StudentReportDetail) => {
    setEditingDetail(detail);
    setSelectedReportIdForDetail(detail.student_report_id);
    setDetailModalError(null);
    setDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setEditingDetail(null);
    setSelectedReportIdForDetail(null);
    setDetailModalError(null);
  };

  const handleDetailSubmit = async (values: StudentReportDetailFormValues) => {
    const payload = {
      student_report_id: values.student_report_id,
      teacher_id: Number(values.teacher_id),
      course_id: Number(values.course_id),
      remarks: values.remarks || undefined,
      note: values.note === '' ? null : Number(values.note),
      status: values.status,
    };
    try {
      if (editingDetail) {
        await updateDetailMut.mutateAsync({ id: editingDetail.id, data: payload });
        setAlert({ type: 'success', message: 'Report detail updated successfully.' });
      } else {
        await createDetailMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Report detail created successfully.' });
      }
      handleDetailModalClose();
      refetchDetails();
      refetchReports();
    } catch (err: any) {
      setDetailModalError(extractErrorMessage(err));
      throw err;
    }
  };

  const handleDeleteDetail = async () => {
    if (!deleteDetailTarget) return;
    try {
      await deleteDetailMut.mutateAsync(deleteDetailTarget.id);
      setAlert({ type: 'success', message: 'Report detail deleted successfully.' });
      setDeleteDetailTarget(null);
      refetchDetails();
    } catch (err: any) {
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

  const modalStudentOptions = useMemo<SearchSelectOption[]>(
    () =>
      classStudents.map((assignment) => ({
        value: assignment.student_id!,
        label: formatAssignmentStudent(assignment),
      })),
    [classStudents]
  );

  const modalPeriodOptions = useMemo<SearchSelectOption[]>(
    () =>
      selectedPeriod
        ? periodOptions.filter((opt) => Number(opt.value) === Number(selectedPeriod))
        : periodOptions,
    [periodOptions, selectedPeriod]
  );

  const deleteEntityName = useMemo(() => {
    if (!deleteTarget) return undefined;
    const assignment = classStudents.find((item) => item.student_id === deleteTarget.student_id);
    if (assignment) return formatAssignmentStudent(assignment);
    return `Student #${deleteTarget.student_id}`;
  }, [deleteTarget, classStudents]);

  const canShowGrid = selectedYear && selectedPeriod && selectedClass;

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

      {reportsError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(reportsError as Error).message}
        </div>
      )}
      {classStudentsError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(classStudentsError as Error).message}
        </div>
      )}

      {!canShowGrid ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Select a school year, period, and class to view student reports.
        </div>
      ) : classStudentsLoading || reportsLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading class students…
        </div>
      ) : classStudents.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No students are registered in this class.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* First Column: Students List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {classStudents.map((assignment) => {
                const studentId = assignment.student_id!;
                const report = reportsByStudentId.get(studentId);
                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const avatar = getAvatarForStudent(assignment);
                        return avatar.type === 'image' ? (
                          <img
                            src={avatar.value}
                            alt={formatAssignmentStudent(assignment)}
                            className="h-10 w-10 rounded-full object-cover border border-white shadow"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                            {avatar.value}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{formatAssignmentStudent(assignment)}</p>
                        <p className="text-xs text-gray-500">Student #{studentId}</p>
                      </div>
                    </div>
                    {report && (
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
              })}
            </div>
          </div>

          {/* Second Column: Empty for now */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Reserved</h2>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              This column is reserved for future use.
            </div>
          </div>

          {/* Third Column: Courses and Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Courses & Notes</h2>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {classStudents
                .filter((assignment) => {
                  const studentId = assignment.student_id!;
                  return reportsByStudentId.has(studentId);
                })
                .map((assignment) => {
                  const studentId = assignment.student_id!;
                  const report = reportsByStudentId.get(studentId);
                  const details = detailsByStudentId.get(studentId) || [];
                  if (!report) return null;
                  return (
                    <div key={assignment.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        {(() => {
                          const avatar = getAvatarForStudent(assignment);
                          return avatar.type === 'image' ? (
                            <img
                              src={avatar.value}
                              alt={formatAssignmentStudent(assignment)}
                              className="h-8 w-8 rounded-full object-cover border border-white shadow"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                              {avatar.value}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatAssignmentStudent(assignment)}</p>
                          <p className="text-xs text-gray-500">Student #{studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          {details.length} {details.length === 1 ? 'detail' : 'details'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateDetail(report.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          + Add detail
                        </button>
                      </div>
                      {details.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No course details yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {details.map((detail) => (
                            <div key={detail.id} className="rounded-md border border-gray-100 bg-gray-50 p-2 group">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {detail.course?.title || `Course #${detail.course_id}`}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {detail.teacher
                                      ? `${detail.teacher.first_name ?? ''} ${detail.teacher.last_name ?? ''}`.trim() ||
                                        detail.teacher.email ||
                                        `Teacher #${detail.teacher_id}`
                                      : `Teacher #${detail.teacher_id}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {detail.note !== null && detail.note !== undefined && (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
                                      {detail.note}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDetail(detail)}
                                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-700 px-1"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteDetailTarget(detail)}
                                    className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:text-red-700 px-1"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {detail.remarks && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{detail.remarks}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              {classStudents
                .filter((assignment) => {
                  const studentId = assignment.student_id!;
                  return reportsByStudentId.has(studentId);
                })
                .map((assignment) => {
                  const studentId = assignment.student_id!;
                  const report = reportsByStudentId.get(studentId);
                  const details = detailsByStudentId.get(studentId) || [];
                  if (!report) return null;
                  return (
                    <div key={assignment.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        {(() => {
                          const avatar = getAvatarForStudent(assignment);
                          return avatar.type === 'image' ? (
                            <img
                              src={avatar.value}
                              alt={formatAssignmentStudent(assignment)}
                              className="h-8 w-8 rounded-full object-cover border border-white shadow"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                              {avatar.value}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatAssignmentStudent(assignment)}</p>
                          <p className="text-xs text-gray-500">Student #{studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          {details.length} {details.length === 1 ? 'detail' : 'details'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateDetail(report.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          + Add detail
                        </button>
                      </div>
                      {details.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No course details yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {details.map((detail) => (
                            <div key={detail.id} className="rounded-md border border-gray-100 bg-gray-50 p-2 group">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {detail.course?.title || `Course #${detail.course_id}`}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {detail.teacher
                                      ? `${detail.teacher.first_name ?? ''} ${detail.teacher.last_name ?? ''}`.trim() ||
                                        detail.teacher.email ||
                                        `Teacher #${detail.teacher_id}`
                                      : `Teacher #${detail.teacher_id}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {detail.note !== null && detail.note !== undefined && (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
                                      {detail.note}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDetail(detail)}
                                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-700 px-1"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteDetailTarget(detail)}
                                    className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:text-red-700 px-1"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {detail.remarks && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{detail.remarks}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
                .filter(Boolean)}
              {classStudents.filter((assignment) => {
                const studentId = assignment.student_id!;
                return reportsByStudentId.has(studentId);
              }).length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No students with reports yet. Create reports to see course details here.
                </div>
              )}
            </div>
          </div>
        </div>
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

      {selectedReportIdForDetail && (
        <StudentReportDetailModal
          isOpen={detailModalOpen}
          onClose={handleDetailModalClose}
          initialData={editingDetail ?? undefined}
          reportId={selectedReportIdForDetail}
          onSubmit={handleDetailSubmit}
          isSubmitting={createDetailMut.isPending || updateDetailMut.isPending}
          teacherOptions={teacherOptions}
          courseOptions={courseOptions}
          serverError={detailModalError}
        />
      )}

      <DeleteModal
        isOpen={!!deleteDetailTarget}
        onCancel={() => setDeleteDetailTarget(null)}
        onConfirm={handleDeleteDetail}
        isLoading={deleteDetailMut.isPending}
        title="Delete Report Detail"
        entityName={deleteDetailTarget?.course?.title || undefined}
      />
    </div>
  );
};

export default StudentReportsSection;


