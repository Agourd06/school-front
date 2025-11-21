import React, { useEffect, useMemo, useState } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import BaseModal from '../modals/BaseModal';
import StudentReportDetailModal, { type StudentReportDetailFormValues } from '../modals/StudentReportDetailModal';
import DeleteModal from '../modals/DeleteModal';
import { EditButton, DeleteButton, Button } from '../ui';
import type { StudentReport, StudentReportStatus } from '../../api/studentReport';
import type { StudentReportDetail } from '../../api/studentReportDetail';
import {
  useStudentReports,
  useStudentReport,
} from '../../hooks/useStudentReports';
import {
  useStudentReportDetails,
  useCreateStudentReportDetail,
  useUpdateStudentReportDetail,
  useDeleteStudentReportDetail,
} from '../../hooks/useStudentReportDetails';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { useStudents } from '../../hooks/useStudents';
import { useTeachers } from '../../hooks/useTeachers';
import { useCourses } from '../../hooks/useCourses';
import { STATUS_VALUE_LABEL } from '../../constants/status';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-200 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
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

const StudentReportDetailsSection: React.FC = () => {
  const [filters, setFilters] = useState({
    year: '',
    period: '',
    student: '',
  });
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportPagination, setReportPagination] = useState({ page: 1, limit: 10 });
  const [detailsPagination, setDetailsPagination] = useState({ page: 1, limit: 10 });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<StudentReportDetail | null>(null);
  const [deleteDetailTarget, setDeleteDetailTarget] = useState<StudentReportDetail | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ title: string; content: string } | null>(null);
  const [detailModalError, setDetailModalError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: yearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 } as any);
  const { data: periodsResp, isLoading: periodsLoading } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    schoolYearId: filters.year ? Number(filters.year) : undefined,
  } as any);
  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: 200 } as any);
  const { data: teachersResp } = useTeachers({ page: 1, limit: 200 } as any);
  const { data: coursesResp } = useCourses({ page: 1, limit: 200 } as any);

  const reportParams = useMemo(
    () => ({
      page: reportPagination.page,
      limit: reportPagination.limit,
      school_year_id: filters.year ? Number(filters.year) : undefined,
      school_year_period_id: filters.period ? Number(filters.period) : undefined,
      student_id: filters.student ? Number(filters.student) : undefined,
    }),
    [filters, reportPagination]
  );

  const {
    data: reportsResp,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useStudentReports(reportParams);

  const reports = reportsResp?.data ?? [];
  const reportMeta =
    reportsResp?.meta ?? { ...EMPTY_META, page: reportPagination.page, limit: reportPagination.limit };

  const selectedReportQuery = useStudentReport(selectedReportId ?? 0);
  const selectedReport = selectedReportQuery.data as StudentReport | undefined;

  const detailParams = useMemo(
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
  } = useStudentReportDetails(detailParams, { enabled: !!selectedReportId });

  const details = detailsResp?.data ?? [];
  const detailsMeta =
    detailsResp?.meta ?? { ...EMPTY_META, page: detailsPagination.page, limit: detailsPagination.limit };

  const createDetailMut = useCreateStudentReportDetail();
  const updateDetailMut = useUpdateStudentReportDetail();
  const deleteDetailMut = useDeleteStudentReportDetail();

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
    if (!selectedReportId) return;
    const exists = reports.some((report) => report.id === selectedReportId);
    if (!exists) {
      setSelectedReportId(null);
      setDetailsPagination({ page: 1, limit: 10 });
    }
  }, [reports, selectedReportId]);

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const handleFilterChange = (field: 'year' | 'period' | 'student') => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === '' ? '' : String(value),
    }));
    setReportPagination((prev) => ({ ...prev, page: 1 }));
    if (field !== 'student') {
      setSelectedReportId(null);
      setDetailsPagination({ page: 1, limit: 10 });
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
    } catch (err: any) {
      setDetailModalError(extractErrorMessage(err));
      throw err;
    }
  };

  const handleConfirmDeleteDetail = async () => {
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

  const openRemarkModal = (title: string, content: string) => setRemarkModal({ title, content });
  const closeRemarkModal = () => setRemarkModal(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Student Report Details</h1>
          <p className="text-sm text-gray-500">
            Filter student reports and manage their detailed evaluations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label="School Year"
          value={filters.year}
          onChange={(value) => {
            handleFilterChange('year')(value);
            setFilters((prev) => ({ ...prev, period: '', student: '' }));
          }}
          options={yearOptions}
          placeholder={yearsLoading ? 'Loading years…' : 'Select school year'}
          isClearable
        />
        <SearchSelect
          label="Period"
          value={filters.period}
          onChange={(value) => {
            handleFilterChange('period')(value);
            setFilters((prev) => ({ ...prev, student: '' }));
          }}
          options={periodOptions}
          placeholder="Select period"
          disabled={!filters.year || periodsLoading}
          isClearable
        />
        <SearchSelect
          label="Student"
          value={filters.student}
          onChange={handleFilterChange('student')}
          options={studentOptions}
          placeholder={studentsLoading ? 'Loading students…' : 'Select student'}
          disabled={!filters.period}
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
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading reports…
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No reports found for the selected filters.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isSelected = report.id === selectedReportId;
                  return (
                    <tr key={report.id} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{formatStudentName(report)}</div>
                        <div className="text-xs text-gray-500">#{report.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.period?.title || `Period #${report.school_year_period_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{report.mention || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[report.status] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[report.status] ?? `Status ${report.status}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                          className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          {isSelected ? 'Hide details' : 'View details'}
                        </button>
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
          onPageChange={(page) => setReportPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setReportPagination({ page: 1, limit })}
          isLoading={reportsLoading}
        />
      </div>

      {selectedReportId && (
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
              <p className="text-sm text-gray-500">
                {selectedReport
                  ? `${formatStudentName(selectedReport)} — ${
                      selectedReport.period?.title || `Period #${selectedReport.school_year_period_id}`
                    }`
                  : 'Loading report information…'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={openCreateDetail}
                disabled={!selectedReportId}
                className="inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add detail
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedReportId(null)}
                className="inline-flex items-center gap-2"
              >
                Close
              </Button>
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
                    Note
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
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Loading report details…
                    </td>
                  </tr>
                ) : details.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
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
                      <td className="px-4 py-3 text-sm text-gray-700">{detail.note ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
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
                            View remarks
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No remarks</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[detail.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[detail.status] ?? `Status ${detail.status}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton onClick={() => openEditDetail(detail)} />
                          <DeleteButton onClick={() => setDeleteDetailTarget(detail)} />
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

export default StudentReportDetailsSection;


