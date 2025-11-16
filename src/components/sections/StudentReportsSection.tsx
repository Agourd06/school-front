import React, { useEffect, useMemo, useState } from 'react';
import {
  useStudentReports,
  useStudentReport,
  useCreateStudentReport,
  useUpdateStudentReport,
  useDeleteStudentReport,
} from '../../hooks/useStudentReports';
import {
  useStudentReportDetails,
  useCreateStudentReportDetail,
  useUpdateStudentReportDetail,
  useDeleteStudentReportDetail,
} from '../../hooks/useStudentReportDetails';
import { useStudents } from '../../hooks/useStudents';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useTeachers } from '../../hooks/useTeachers';
import { useCourses } from '../../hooks/useCourses';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import StudentReportModal, { type StudentReportFormValues } from '../modals/StudentReportModal';
import StudentReportDetailModal, { type StudentReportDetailFormValues } from '../modals/StudentReportDetailModal';
import DeleteModal from '../modals/DeleteModal';
import BaseModal from '../modals/BaseModal';
import type { StudentReport, StudentReportStatus } from '../../api/studentReport';
import type { StudentReportDetail } from '../../api/studentReportDetail';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM, STATUS_VALUE_LABEL } from '../../constants/status';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const statusFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const passFilterOptions: SearchSelectOption[] = [
  { value: 'all', label: 'All results' },
  { value: 'true', label: 'Passed' },
  { value: 'false', label: 'Not passed' },
];

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-200 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
};

const getStatusLabel = (status: number) => STATUS_VALUE_LABEL[status] ?? `Status ${status}`;

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

const formatStudentName = (report: StudentReport) => {
  const first = report.student?.first_name ?? '';
  const last = report.student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || report.student?.email || `Student #${report.student_id}`;
};

const StudentReportsSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    period: '',
    passed: 'all',
  });
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [detailsPagination, setDetailsPagination] = useState({ page: 1, limit: 10 });

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<StudentReport | null>(null);
  const [editingDetail, setEditingDetail] = useState<StudentReportDetail | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<StudentReport | null>(null);
  const [deleteDetailTarget, setDeleteDetailTarget] = useState<StudentReportDetail | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ title: string; content: string } | null>(null);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);
  const [detailModalError, setDetailModalError] = useState<string | null>(null);

  const allowedStatusValues = useMemo(() => new Set(STATUS_OPTIONS_FORM.map((opt) => Number(opt.value))), []);

  const reportParams = useMemo(() => {
    return {
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : (filters.status !== '' ? (Number(filters.status) as StudentReportStatus) : undefined),
      student_id: filters.student ? Number(filters.student) : undefined,
      school_year_period_id: filters.period ? Number(filters.period) : undefined,
      passed: filters.passed === 'all' ? undefined : filters.passed === 'true',
    };
  }, [filters, pagination]);

  const {
    data: reportsResp,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useStudentReports(reportParams);

  const reports = reportsResp?.data ?? [];
  const reportMeta = reportsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const reportQuery = useStudentReport(selectedReportId ?? 0);
  const reportDetailsParams = useMemo(
    () => ({
      page: detailsPagination.page,
      limit: detailsPagination.limit,
      student_report_id: selectedReportId ?? undefined,
    }),
    [detailsPagination, selectedReportId]
  );

  const {
    data: detailsResp,
    isLoading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useStudentReportDetails(reportDetailsParams, { enabled: !!selectedReportId });
  const details = detailsResp?.data ?? [];
  const detailsMeta =
    detailsResp?.meta ??
    { ...EMPTY_META, page: detailsPagination.page, limit: detailsPagination.limit };

  const createReportMut = useCreateStudentReport();
  const updateReportMut = useUpdateStudentReport();
  const deleteReportMut = useDeleteStudentReport();

  const createDetailMut = useCreateStudentReportDetail();
  const updateDetailMut = useUpdateStudentReportDetail();
  const deleteDetailMut = useDeleteStudentReportDetail();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  const { data: periodsResp } = useSchoolYearPeriods({ page: 1, limit: 100 } as any);
  const { data: teachersResp } = useTeachers({ page: 1, limit: 100 } as any);
  const { data: coursesResp } = useCourses({ page: 1, limit: 100 } as any);

  const studentOptions = useMemo<SearchSelectOption[]>(
    () =>
      (studentsResp?.data || []).map((student) => ({
        value: student.id,
        label:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
          student.email ||
          `Student #${student.id}`,
      })),
    [studentsResp]
  );
  const periodOptions = useMemo<SearchSelectOption[]>(
    () =>
      (periodsResp?.data || []).map((period) => ({
        value: period.id,
        label: period.title || `Period #${period.id}`,
      })),
    [periodsResp]
  );
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

  const openCreateReport = () => {
    setEditingReport(null);
    setReportModalError(null);
    setReportModalOpen(true);
  };

  const openEditReport = (report: StudentReport) => {
    setEditingReport(report);
    setReportModalError(null);
    setReportModalOpen(true);
  };

  const handleReportModalClose = () => {
    setReportModalOpen(false);
    setEditingReport(null);
    setReportModalError(null);
  };

  const handleReportSubmit = async (values: StudentReportFormValues) => {
    setReportModalError(null);
    setAlert(null);
    if (!allowedStatusValues.has(values.status)) {
      const message = 'Invalid status selected.';
      setReportModalError(message);
      setAlert({ type: 'error', message });
      return;
    }
    try {
      if (editingReport) {
        await updateReportMut.mutateAsync({
          id: editingReport.id,
          data: {
            school_year_period_id: Number(values.school_year_period_id),
            student_id: Number(values.student_id),
            remarks: values.remarks || undefined,
            mention: values.mention || undefined,
            passed: values.passed,
            status: values.status,
          },
        });
        setAlert({ type: 'success', message: 'Student report updated successfully.' });
      } else {
        await createReportMut.mutateAsync({
          school_year_period_id: Number(values.school_year_period_id),
          student_id: Number(values.student_id),
          remarks: values.remarks || undefined,
          mention: values.mention || undefined,
          passed: values.passed,
          status: values.status,
        });
        setAlert({ type: 'success', message: 'Student report created successfully.' });
      }
      handleReportModalClose();
      refetchReports();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setReportModalError(message);
      setAlert({ type: 'error', message });
      throw err;
    }
  };

  const handleConfirmDeleteReport = async () => {
    if (!deleteReportTarget) return;
    setAlert(null);
    try {
      await deleteReportMut.mutateAsync(deleteReportTarget.id);
      setAlert({ type: 'success', message: 'Student report deleted successfully.' });
      if (selectedReportId === deleteReportTarget.id) {
        handleCloseDetails();
      }
      setDeleteReportTarget(null);
      refetchReports();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  const openCreateDetail = () => {
    if (!selectedReportId) return;
    setEditingDetail(null);
    setDetailModalError(null);
    setDetailModalOpen(true);
  };

  const openEditDetail = (detail: StudentReportDetail) => {
    setEditingDetail(detail);
    setDetailModalError(null);
    setDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setEditingDetail(null);
    setDetailModalError(null);
  };

  const handleDetailSubmit = async (values: StudentReportDetailFormValues) => {
    setDetailModalError(null);
    setAlert(null);
    if (!allowedStatusValues.has(values.status)) {
      const message = 'Invalid status selected.';
      setDetailModalError(message);
      setAlert({ type: 'error', message });
      return;
    }
    try {
      if (editingDetail) {
        await updateDetailMut.mutateAsync({
          id: editingDetail.id,
          data: {
            student_report_id: values.student_report_id,
            teacher_id: Number(values.teacher_id),
            course_id: Number(values.course_id),
            remarks: values.remarks || undefined,
            status: values.status,
          },
        });
        setAlert({ type: 'success', message: 'Report detail updated successfully.' });
      } else {
        await createDetailMut.mutateAsync({
          student_report_id: values.student_report_id,
          teacher_id: Number(values.teacher_id),
          course_id: Number(values.course_id),
          remarks: values.remarks || undefined,
          status: values.status,
        });
        setAlert({ type: 'success', message: 'Report detail added successfully.' });
      }
      handleDetailModalClose();
      refetchDetails();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setDetailModalError(message);
      setAlert({ type: 'error', message });
      throw err;
    }
  };

  const handleConfirmDeleteDetail = async () => {
    if (!deleteDetailTarget) return;
    setAlert(null);
    try {
      await deleteDetailMut.mutateAsync(deleteDetailTarget.id);
      setAlert({ type: 'success', message: 'Report detail deleted successfully.' });
      setDeleteDetailTarget(null);
      refetchDetails();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePassFilterChange = (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      passed: value === undefined || value === null ? 'all' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCloseDetails = () => {
    setSelectedReportId(null);
    setDetailsPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectReport = (report: StudentReport) => {
    if (selectedReportId === report.id) {
      handleCloseDetails();
      return;
    }
    setSelectedReportId(report.id);
    setDetailsPagination((prev) => ({ ...prev, page: 1 }));
  };

  const selectedReport = reportQuery.data as StudentReport | undefined;

  useEffect(() => {
    if (reportQuery.error) {
      const maybeError = reportQuery.error as any;
      if (maybeError?.response?.status === 404) {
        handleCloseDetails();
        setAlert({ type: 'error', message: 'Selected report is no longer available.' });
      }
    }
  }, [reportQuery.error]);

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const openRemarkModal = (title: string, content: string) => {
    setRemarkModal({ title, content });
  };
  const closeRemarkModal = () => setRemarkModal(null);

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Reports</h1>
            <p className="text-sm text-gray-500">
              Track academic reports and detailed evaluations for each student.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Report
            </button>
          </div>
        </div>
        {alert && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              alert.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {alert.message}
          </div>
        )}
        {reportsError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(reportsError as Error).message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label="Student"
            value={filters.student}
            onChange={handleFilterChange('student')}
            options={studentOptions}
            placeholder="All students"
            isClearable
          />
          <SearchSelect
            label="Period"
            value={filters.period}
            onChange={handleFilterChange('period')}
            options={periodOptions}
            placeholder="All periods"
            isClearable
          />
          <SearchSelect
            label="Result"
            value={filters.passed}
            onChange={handlePassFilterChange}
            options={passFilterOptions}
            isClearable={false}
          />
        </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mention
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Result
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reportsLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading student reports…
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No student reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isSelected = report.id === selectedReportId;
                  return (
                    <tr
                      key={report.id}
                      className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSelectReport(report)}
                          className="text-left font-medium text-blue-600 hover:text-blue-800"
                        >
                          {formatStudentName(report)}
                        </button>
                        <div className="text-xs text-gray-500">#{report.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.period?.title || `Period #${report.school_year_period_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{report.mention || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            report.passed ? passedStyles.passed : passedStyles.failed
                          }`}
                        >
                          {report.passed ? 'Passed' : 'Not Passed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                          {report.remarks ? (
                            <button
                              type="button"
                              onClick={() => openRemarkModal('Report Remarks', report.remarks || '')}
                              className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              View Remarks
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No remarks</span>
                          )}
                          {report.created_at && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                              Created {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          )}
                          {report.updated_at && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                              Updated {new Date(report.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[report.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditReport(report)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteReportTarget(report)}
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectReport(report)}
                            className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            {isSelected ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={reportMeta.page}
          totalPages={reportMeta.totalPages}
          totalItems={reportMeta.total}
          itemsPerPage={reportMeta.limit}
          hasNext={reportMeta.hasNext}
          hasPrevious={reportMeta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={reportsLoading}
        />
      </div>

      {selectedReportId && (
        <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report Details
            </h2>
            <p className="text-sm text-gray-500">
              {selectedReport
                ? `${formatStudentName(selectedReport)} — ${
                    selectedReport.period?.title || `Period #${selectedReport.school_year_period_id}`
                  }`
                : 'Loading report information…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateDetail}
              disabled={!selectedReportId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Detail
            </button>
            <button
              type="button"
              onClick={handleCloseDetails}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              X
            </button>
          </div>
        </div>

        {detailsError && (
          <div className="px-4 py-3 border-b border-red-200 bg-red-50 text-sm text-red-700">
            {(detailsError as Error).message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {detailsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading report details…
                  </td>
                </tr>
              ) : details.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No details added yet.
                  </td>
                </tr>
              ) : (
                details.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {detail.teacher
                        ? `${detail.teacher.first_name ?? ''} ${detail.teacher.last_name ?? ''}`.trim() ||
                          detail.teacher.email ||
                          `Teacher #${detail.teacher_id}`
                        : `Teacher #${detail.teacher_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {detail.course?.title || `Course #${detail.course_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        {detail.remarks ? (
                          <button
                            type="button"
                            onClick={() =>
                              openRemarkModal(
                                `Detail Remarks • ${detail.course?.title || `Course #${detail.course_id}`}`,
                                detail.remarks || ''
                              )
                            }
                            className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            View Remarks
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No remarks</span>
                        )}
                        {detail.created_at && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Created {new Date(detail.created_at).toLocaleDateString()}
                          </span>
                        )}
                        {detail.updated_at && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Updated {new Date(detail.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[detail.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {getStatusLabel(detail.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDetail(detail)}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDetailTarget(detail)}
                          className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={detailsMeta.page}
          totalPages={detailsMeta.totalPages}
          totalItems={detailsMeta.total}
          itemsPerPage={detailsMeta.limit}
          hasNext={detailsMeta.hasNext}
          hasPrevious={detailsMeta.hasPrevious}
          onPageChange={(page) => setDetailsPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setDetailsPagination({ page: 1, limit })}
          isLoading={detailsLoading}
        />
        </div>
      )}

      <StudentReportModal
        isOpen={reportModalOpen}
        onClose={handleReportModalClose}
        initialData={editingReport ?? undefined}
        onSubmit={handleReportSubmit}
        isSubmitting={createReportMut.isPending || updateReportMut.isPending}
        periodOptions={periodOptions}
        studentOptions={studentOptions}
        serverError={reportModalError}
      />

      {selectedReportId && (
        <StudentReportDetailModal
          isOpen={detailModalOpen}
          onClose={handleDetailModalClose}
          initialData={editingDetail ?? undefined}
          reportId={selectedReportId}
          onSubmit={handleDetailSubmit}
          isSubmitting={createDetailMut.isPending || updateDetailMut.isPending}
          teacherOptions={teacherOptions}
          courseOptions={courseOptions}
          serverError={detailModalError}
        />
      )}

      <DeleteModal
        isOpen={!!deleteReportTarget}
        onCancel={() => setDeleteReportTarget(null)}
        onConfirm={handleConfirmDeleteReport}
        isLoading={deleteReportMut.isPending}
        title="Delete Student Report"
        entityName={deleteReportTarget ? formatStudentName(deleteReportTarget) : undefined}
      />

      <DeleteModal
        isOpen={!!deleteDetailTarget}
        onCancel={() => setDeleteDetailTarget(null)}
        onConfirm={handleConfirmDeleteDetail}
        isLoading={deleteDetailMut.isPending}
        title="Delete Report Detail"
        entityName={deleteDetailTarget?.course?.title || undefined}
      />

      {remarkModal && (
        <BaseModal
          isOpen
          onClose={closeRemarkModal}
          title={remarkModal.title}
          className="sm:max-w-3xl"
          contentClassName="space-y-4"
        >
          <div className="rt-content max-h-[60vh] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: remarkModal.content || '<p>No remarks provided.</p>' }} />
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default StudentReportsSection;


