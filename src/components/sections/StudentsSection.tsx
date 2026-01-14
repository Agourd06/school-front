import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useStudents,
  useDeleteStudent,
  useSendPasswordInvitation,
} from '../../hooks/useStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import { StudentModal, StudentOnboardingModal } from '../modals';
import DeleteModal from '../modals/DeleteModal';
import ExcelImportModal from '../modals/ExcelImportModal';
import { EditButton, DeleteButton, Input, Button, PageHeader } from '../ui';
import StatusBadge from '../../components/StatusBadge';
import type { Student } from '../../api/students';
import { STATUS_OPTIONS } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Mail, Upload, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const getStatusFilterOptions = (t: (key: string) => string): SearchSelectOption[] => [
  { value: 'all', label: t('sections.allStatuses') },
  ...STATUS_OPTIONS.filter((opt) => opt.value !== -2).map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
};

const StudentsSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? Number(filters.status)
          : undefined,
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: studentsResp,
    isLoading,
    error,
    refetch: refetchStudents,
  } = useStudents(params);

  const students = useMemo(() => {
    const allStudents = studentsResp?.data ?? [];
    // Filter out deleted students (status -2) unless explicitly filtering for them
    if (filters.status === 'all' || filters.status === '') {
      return allStudents.filter((student: Student) => student.status !== -2);
    }
    return allStudents;
  }, [studentsResp?.data, filters.status]);
  const meta = studentsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteStudentMut = useDeleteStudent();
  const sendInvitationMut = useSendPasswordInvitation();
  const [invitationSentTimes, setInvitationSentTimes] = useState<Record<number, number>>({});

  // Load invitation sent times from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('studentInvitationSentTimes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out entries older than 24 hours
        const now = Date.now();
        const filtered: Record<number, number> = {};
        Object.entries(parsed).forEach(([id, time]) => {
          const studentId = Number(id);
          const sentTime = Number(time);
          if (now - sentTime < 24 * 60 * 60 * 1000) {
            filtered[studentId] = sentTime;
          }
        });
        setInvitationSentTimes(filtered);
        if (Object.keys(filtered).length !== Object.keys(parsed).length) {
          localStorage.setItem('studentInvitationSentTimes', JSON.stringify(filtered));
        }
      } catch (e) {
        // Invalid data, ignore
      }
    }
  }, []);

  const canSendInvitation = (studentId: number): boolean => {
    const sentTime = invitationSentTimes[studentId];
    if (!sentTime) return true;
    const now = Date.now();
    const hoursSinceSent = (now - sentTime) / (1000 * 60 * 60);
    return hoursSinceSent >= 24;
  };

  const getTimeUntilCanSend = (studentId: number): number => {
    const sentTime = invitationSentTimes[studentId];
    if (!sentTime) return 0;
    const now = Date.now();
    const msUntilCanSend = 24 * 60 * 60 * 1000 - (now - sentTime);
    return Math.max(0, Math.ceil(msUntilCanSend / (1000 * 60 * 60))); // hours
  };

  const handleSendPasswordInvitation = async (student: Student) => {
    try {
      await sendInvitationMut.mutateAsync(student.id);
      const newTimes = { ...invitationSentTimes, [student.id]: Date.now() };
      setInvitationSentTimes(newTimes);
      localStorage.setItem('studentInvitationSentTimes', JSON.stringify(newTimes));
      setAlert({ type: 'success', message: t('forms.passwordInvitationEmailSentTo', { email: student.email }) });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, t);
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  const openCreateModal = () => {
    setOnboardingOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedStudents(new Set()); // Clear selection when filters change
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedStudents(new Set()); // Clear selection when search changes
  };

  const handleModalClose = () => {
    closeModal();
    refetchStudents();
  };

  const handleOnboardingClose = () => {
    setOnboardingOpen(false);
    refetchStudents();
  };

  const handleStudentCreated = (studentEmail: string) => {
    setAlert({
      type: 'success',
      message: `${t('messages.studentCreatedSuccessfully')} ${studentEmail}.`,
    });
  };

  const requestDelete = (student: Student) => {
    setDeleteTarget(student);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteStudentMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteTarget.id);
        return newSet;
      });
      setAlert({ type: 'success', message: t('messages.studentDeletedSuccessfully') });
      refetchStudents();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const getStudentName = (student: Student) => {
    return `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `${t('forms.studentNumber')}${student.id}`;
  };

  const getPictureUrl = (picture?: string) => {
    if (!picture) return null;
    return getFileUrl(picture);
  };

  // Selection handlers
  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(students.map((s) => s.id));
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const isAllSelected = students.length > 0 && students.every((s) => selectedStudents.has(s.id));
  const isSomeSelected = students.some((s) => selectedStudents.has(s.id));

  // Export to Excel
  const handleExportToExcel = () => {
    if (selectedStudents.size === 0) return;

    const selectedStudentsData = students.filter((s) => selectedStudents.has(s.id));

    // Prepare data with the same structure as import
    const exportData = selectedStudentsData.map((student) => ({
      email: student.email || '',
      phone: student.phone || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      birthday: student.birthday || '',
      gender: student.gender || '',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'students_export.xlsx');

    setAlert({ type: 'success', message: `Exported ${selectedStudents.size} student(s) to Excel successfully!` });
  };

  return (
    <div className="space-y-6">
        <PageHeader
          titleKey="pages.studentsTitle"
          descriptionKey="pages.studentsDescription"
          icon={<Users className="w-5 h-5" />}
          actions={
            <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportToExcel}
              disabled={selectedStudents.size === 0}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExcelImportOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Students (Excel)
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('sections.addStudent')}
            </Button>
            </>
          }
        />
        {alert && (
          <div
            className={`mt-4 rounded-lg border-2 px-4 py-3 text-sm shadow-sm ${
              alert.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {alert.message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SearchSelect
              label={t('common.status')}
              value={filters.status}
              onChange={handleFilterChange('status')}
              options={statusFilterOptions}
              isClearable={false}
            />
            <div className="md:col-span-2">
              <Input
                label={t('common.search')}
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder={t('forms.searchByStudentName')}
                className="shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    title="Select All"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('common.name')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('forms.genderPhone')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('common.status')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.loadingStudents')}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.noStudentsFound')}
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const pictureUrl = getPictureUrl(student.picture);
                  const isSelected = selectedStudents.has(student.id);
                  return (
                    <tr key={student.id} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectStudent(student.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {pictureUrl && (
                            <img
                              src={pictureUrl}
                              alt={`${student.first_name} ${student.last_name}`}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="text-sm font-semibold text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {student.gender || '—'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {student.phone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge value={student.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {student.status === 2 && (
                          <Button
                            type="button"
                            variant={canSendInvitation(student.id) ? 'primary' : 'secondary'}
                            onClick={() => handleSendPasswordInvitation(student)}
                            disabled={!canSendInvitation(student.id) || sendInvitationMut.isPending}
                            className={`text-xs px-2 py-1 ${
                              !canSendInvitation(student.id) ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                            title={
                              canSendInvitation(student.id)
                                ? t('forms.sendPasswordInvitationEmail')
                                : t('forms.canSendAgainIn', { hours: getTimeUntilCanSend(student.id) })
                            }
                          >
                            <Mail className="h-3 w-3 mr-1 inline" />
                            {canSendInvitation(student.id) ? t('forms.sendInvitation') : `${getTimeUntilCanSend(student.id)}h`}
                          </Button>
                        )}
                        <EditButton onClick={() => openEditModal(student)} />
                        <DeleteButton onClick={() => requestDelete(student)} />
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
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
          hasNext={meta.hasNext}
          hasPrevious={meta.hasPrevious}
          onPageChange={(page) => {
            setPagination((prev) => ({ ...prev, page }));
            setSelectedStudents(new Set()); // Clear selection when page changes
          }}
          onPageSizeChange={(limit) => {
            setPagination({ page: 1, limit });
            setSelectedStudents(new Set()); // Clear selection when page size changes
          }}
          isLoading={isLoading}
        />
      </div>

      <StudentModal isOpen={modalOpen} onClose={handleModalClose} student={editingStudent ?? undefined} />

      {onboardingOpen && (
        <StudentOnboardingModal isOpen onClose={handleOnboardingClose} onStudentCreated={handleStudentCreated} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('forms.deleteStudent')}
        entityName={deleteTarget ? getStudentName(deleteTarget) : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteStudentMut.isPending}
      />

      <ExcelImportModal
        isOpen={excelImportOpen}
        onClose={() => setExcelImportOpen(false)}
        onImportSuccess={() => {
          setSelectedStudents(new Set()); // Clear selection after import
          refetchStudents();
          setAlert({ type: 'success', message: 'Students imported successfully!' });
        }}
      />
    </div>
  );
};

export default StudentsSection;
