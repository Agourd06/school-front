import React, { useEffect, useMemo, useState } from 'react';
import {
  useStudentPresences,
  useCreateStudentPresence,
  useUpdateStudentPresence,
  useDeleteStudentPresence,
} from '../../hooks/useStudentPresence';
import { useStudents } from '../../hooks/useStudents';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
// import { useCompanies } from '../../hooks/useCompanies'; // Removed - company is auto-set from authenticated user
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import StudentPresenceModal, { type StudentPresenceFormValues } from '../modals/StudentPresenceModal';
import DeleteModal from '../modals/DeleteModal';
import BaseModal from '../modals/BaseModal';
import type { StudentPresence, StudentPresenceStatus } from '../../api/studentPresence';
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

const presenceLabel: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

const presenceStyles: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border border-green-200',
  absent: 'bg-red-100 text-red-700 border border-red-200',
  late: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  excused: 'bg-purple-100 text-purple-700 border border-purple-200',
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

const formatStudentName = (presence: StudentPresence) => {
  const first = presence.student?.first_name ?? '';
  const last = presence.student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || presence.student?.email || `Student #${presence.student_id}`;
};

const formatPlanningSummary = (presence: StudentPresence) => {
  const planning = presence.studentPlanning;
  if (!planning) return `Planning #${presence.student_planning_id}`;

  const date = planning.date_day ? new Date(planning.date_day).toLocaleDateString() : null;
  const timeRange =
    planning.hour_start && planning.hour_end ? `${planning.hour_start} – ${planning.hour_end}` : undefined;
  const period = planning.period ?? '';

  return [period, date, timeRange].filter(Boolean).join(' • ') || `Planning #${planning.id}`;
};

const availableStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

const StudentPresenceSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    planning: '',
  });
  const [presenceModalOpen, setPresenceModalOpen] = useState(false);
  const [editingPresence, setEditingPresence] = useState<StudentPresence | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentPresence | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ title: string; content: string } | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? (Number(filters.status) as StudentPresenceStatus)
          : undefined,
      student_id: filters.student ? Number(filters.student) : undefined,
      student_planning_id: filters.planning ? Number(filters.planning) : undefined,
    }),
    [filters, pagination]
  );

  const {
    data: presenceResp,
    isLoading: presenceLoading,
    error: presenceError,
    refetch: refetchPresence,
  } = useStudentPresences(params);

  const presences = presenceResp?.data ?? [];
  const presenceMeta = presenceResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createPresenceMut = useCreateStudentPresence();
  const updatePresenceMut = useUpdateStudentPresence();
  const deletePresenceMut = useDeleteStudentPresence();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  const { data: planningResp } = usePlanningStudents({ page: 1, limit: 100 } as any);
  // const { data: companiesResp } = useCompanies({ page: 1, limit: 100 } as any); // Removed - company is auto-set from authenticated user

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

  const planningOptions = useMemo<SearchSelectOption[]>(
    () =>
      (planningResp?.data || []).map((planning) => {
        const date = planning.date_day ? new Date(planning.date_day).toLocaleDateString() : '';
        const timeRange =
          planning.hour_start && planning.hour_end ? `${planning.hour_start} – ${planning.hour_end}` : '';
        const labelParts = [planning.period, date, timeRange].filter(Boolean);
        return {
          value: planning.id,
          label: labelParts.length > 0 ? labelParts.join(' • ') : `Planning #${planning.id}`,
        };
      }),
    [planningResp]
  );

  // const companyOptions removed - company is auto-set from authenticated user

  const openCreatePresence = () => {
    setEditingPresence(null);
    setModalError(null);
    setPresenceModalOpen(true);
  };

  const openEditPresence = (presence: StudentPresence) => {
    setEditingPresence(presence);
    setModalError(null);
    setPresenceModalOpen(true);
  };

  const closePresenceModal = () => {
    setPresenceModalOpen(false);
    setEditingPresence(null);
    setModalError(null);
  };

  const handlePresenceSubmit = async (values: StudentPresenceFormValues) => {
    setModalError(null);
    setAlert(null);

    if (!availableStatusValues.has(values.status)) {
      const message = 'Invalid status selected.';
      setModalError(message);
      setAlert({ type: 'error', message });
      return;
    }

    const noteValue = values.note.trim() === '' ? -1 : Number(values.note);

    // company_id is automatically set by the API from authenticated user
    const payload = {
      student_planning_id: Number(values.student_planning_id),
      student_id: Number(values.student_id),
      presence: values.presence,
      note: noteValue,
      remarks: values.remarks || undefined,
      status: values.status,
    };

    try {
      if (editingPresence) {
        await updatePresenceMut.mutateAsync({ id: editingPresence.id, data: payload });
        setAlert({ type: 'success', message: 'Student presence updated successfully.' });
      } else {
        await createPresenceMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Student presence created successfully.' });
      }
      closePresenceModal();
      refetchPresence();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setModalError(message);
      setAlert({ type: 'error', message });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deletePresenceMut.mutateAsync(deleteTarget.id);
      const previousStatus = deleteTarget.status && deleteTarget.status !== -2 ? deleteTarget.status : 2;
      setAlert({
        type: 'success',
        message: 'Student presence deleted successfully.',
        actionLabel: 'Undo',
        onAction: () => handleUndoDelete(deleteTarget.id, previousStatus),
      });
      setDeleteTarget(null);
      refetchPresence();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  const handleUndoDelete = async (id: number, status: StudentPresenceStatus) => {
    try {
      await updatePresenceMut.mutateAsync({ id, data: { status } });
      setAlert({ type: 'success', message: 'Student presence restored successfully.' });
      refetchPresence();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert || alert.onAction) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openRemarkModal = (title: string, content: string) => {
    setRemarkModal({ title, content });
  };
  const closeRemarkModal = () => setRemarkModal(null);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Presence</h1>
            <p className="text-sm text-gray-500">
              Monitor attendance records, notes, and remarks for student planning sessions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreatePresence}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Presence
            </button>
          </div>
        </div>
        {alert && (
          <div
            className={`mt-4 flex flex-wrap items-center gap-3 rounded-md border px-4 py-2 text-sm ${
              alert.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span>{alert.message}</span>
            {alert.actionLabel && alert.onAction && (
              <button
                type="button"
                onClick={async () => {
                  const action = alert.onAction;
                  if (action) {
                    await action();
                  }
                }}
                className="inline-flex items-center rounded-md border border-current px-3 py-1 text-xs font-semibold hover:bg-white/20"
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        )}
        {presenceError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(presenceError as Error).message}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            label="Planning"
            value={filters.planning}
            onChange={handleFilterChange('planning')}
            options={planningOptions}
            placeholder="All plannings"
            isClearable
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Planning
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Presence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Note</th>
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
              {presenceLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading student presence…
                  </td>
                </tr>
              ) : presences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No presence records found.
                  </td>
                </tr>
              ) : (
                presences.map((presence) => (
                  <tr key={presence.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium text-gray-900">{formatStudentName(presence)}</div>
                      <div className="text-xs text-gray-500">#{presence.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatPlanningSummary(presence)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          presenceStyles[presence.presence] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {presenceLabel[presence.presence] ?? presence.presence}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {presence.note === null || presence.note === undefined ? (
                        <span className="text-xs text-gray-400">Not set</span>
                      ) : (
                        <span className="font-semibold text-gray-900">{presence.note}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        {presence.remarks ? (
                          <button
                            type="button"
                            onClick={() =>
                              openRemarkModal(
                                `Presence Remarks • ${formatStudentName(presence)}`,
                                presence.remarks || ''
                              )
                            }
                            className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            View Remarks
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No remarks</span>
                        )}
                        {presence.company ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            {presence.company.name || `Company #${presence.company_id}`}
                          </span>
                        ) : null}
                        {presence.created_at && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Created {new Date(presence.created_at).toLocaleDateString()}
                          </span>
                        )}
                        {presence.updated_at && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Updated {new Date(presence.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[presence.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_VALUE_LABEL[presence.status] ?? `Status ${presence.status}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPresence(presence)}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(presence)}
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
          currentPage={presenceMeta.page}
          totalPages={presenceMeta.totalPages}
          totalItems={presenceMeta.total}
          itemsPerPage={presenceMeta.limit}
          hasNext={presenceMeta.hasNext}
          hasPrevious={presenceMeta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={presenceLoading}
        />
      </div>

      <StudentPresenceModal
        isOpen={presenceModalOpen}
        onClose={closePresenceModal}
        initialData={editingPresence ?? undefined}
        onSubmit={handlePresenceSubmit}
        isSubmitting={createPresenceMut.isPending || updatePresenceMut.isPending}
        planningOptions={planningOptions}
        studentOptions={studentOptions}
        // companyOptions removed - company is auto-set from authenticated user
        serverError={modalError}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePresenceMut.isPending}
        title="Delete Student Presence"
        entityName={deleteTarget ? formatStudentName(deleteTarget) : undefined}
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

export default StudentPresenceSection;

