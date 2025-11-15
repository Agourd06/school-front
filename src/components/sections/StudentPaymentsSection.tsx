import React, { useEffect, useMemo, useState } from 'react';
import {
  useStudentPayments,
  useCreateStudentPayment,
  useUpdateStudentPayment,
  useDeleteStudentPayment,
} from '../../hooks/useStudentPayments';
import { useStudents } from '../../hooks/useStudents';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useLevels } from '../../hooks/useLevels';
import { useLevelPricings } from '../../hooks/useLevelPricings';
// import { useCompanies } from '../../hooks/useCompanies'; // Removed - company is auto-set from authenticated user
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import StudentPaymentModal, { type StudentPaymentFormValues } from '../modals/StudentPaymentModal';
import DeleteModal from '../modals/DeleteModal';
import type { StudentPayment, StudentPaymentStatus } from '../../api/studentPayment';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';

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

const formatCurrency = (value: string | number | null | undefined) => {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const getStudentName = (payment: StudentPayment) => {
  const first = payment.student?.first_name ?? '';
  const last = payment.student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || payment.student?.email || `Student #${payment.student_id}`;
};

const StudentPaymentsSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    student: '',
    schoolYear: '',
    level: '',
    levelPricing: '',
    date: '',
    mode: '',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<StudentPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentPayment | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? (Number(filters.status) as StudentPaymentStatus)
          : undefined,
      student_id: filters.student ? Number(filters.student) : undefined,
      school_year_id: filters.schoolYear ? Number(filters.schoolYear) : undefined,
      level_id: filters.level ? Number(filters.level) : undefined,
      level_pricing_id: filters.levelPricing ? Number(filters.levelPricing) : undefined,
      date: filters.date || undefined,
      mode: filters.mode.trim() || undefined,
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: paymentsResp,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = useStudentPayments(params);

  const payments = paymentsResp?.data ?? [];
  const paymentsMeta = paymentsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createPaymentMut = useCreateStudentPayment();
  const updatePaymentMut = useUpdateStudentPayment();
  const deletePaymentMut = useDeleteStudentPayment();

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 } as any);
  const { data: levelsResp } = useLevels({ page: 1, limit: 100 } as any);
  const { data: levelPricingResp } = useLevelPricings({ page: 1, limit: 100 } as any);

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

  const schoolYearOptions = useMemo<SearchSelectOption[]>(
    () =>
      (schoolYearsResp?.data || []).map((year) => ({
        value: year.id,
        label: year.title || `School Year #${year.id}`,
      })),
    [schoolYearsResp]
  );

  const levelOptions = useMemo<SearchSelectOption[]>(
    () =>
      (levelsResp?.data || []).map((level) => ({
        value: level.id,
        label: level.title || `Level #${level.id}`,
      })),
    [levelsResp]
  );

  // const companyOptions removed - company is auto-set from authenticated user

  const levelPricingOptions = useMemo<SearchSelectOption[]>(
    () =>
      (levelPricingResp?.data || []).map((pricing) => ({
        value: pricing.id,
        label: pricing.title || `Pricing #${pricing.id}`,
        data: { level_id: pricing.level_id },
      })),
    [levelPricingResp]
  );

  const filteredLevelPricingFilterOptions = useMemo(() => {
    if (!filters.level) return levelPricingOptions;
    return levelPricingOptions.filter((option) => {
      const levelId = option.data?.level_id ?? option.data?.levelId;
      if (levelId === undefined || levelId === null) return true;
      return Number(levelId) === Number(filters.level);
    });
  }, [filters.level, levelPricingOptions]);

  const openCreateModal = () => {
    setEditingPayment(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (payment: StudentPayment) => {
    setEditingPayment(payment);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPayment(null);
    setModalError(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, date: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTextFilterChange = (field: keyof typeof filters) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSubmit = async (values: StudentPaymentFormValues) => {
    setModalError(null);
    setAlert(null);

    const payload = {
      student_id: Number(values.student_id),
      school_year_id: Number(values.school_year_id),
      level_id: Number(values.level_id),
      level_pricing_id: values.level_pricing_id === '' ? undefined : Number(values.level_pricing_id),
      amount: Number(values.amount),
      payment: Number(values.payment),
      date: values.date,
      mode: values.mode.trim(),
      reference: values.reference.trim() || undefined,
      // company_id is automatically set by the API from authenticated user
      status: values.status,
    };

    try {
      if (editingPayment) {
        await updatePaymentMut.mutateAsync({ id: editingPayment.id, data: payload });
        setAlert({ type: 'success', message: 'Student payment updated successfully.' });
      } else {
        await createPaymentMut.mutateAsync(payload);
        setAlert({ type: 'success', message: 'Student payment created successfully.' });
      }
      closeModal();
      refetchPayments();
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
      await deletePaymentMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Student payment deleted successfully.' });
      refetchPayments();
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Payments</h1>
            <p className="text-sm text-gray-500">Track payments, balances, and payment statuses for students.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Payment
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
        {paymentsError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(paymentsError as Error).message}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
            label="School Year"
            value={filters.schoolYear}
            onChange={handleFilterChange('schoolYear')}
            options={schoolYearOptions}
            placeholder="All school years"
            isClearable
          />
          <SearchSelect
            label="Level"
            value={filters.level}
            onChange={(value) => {
              handleFilterChange('level')(value);
              setFilters((prev) => ({ ...prev, levelPricing: '' }));
            }}
            options={levelOptions}
            placeholder="All levels"
            isClearable
          />
          <SearchSelect
            label="Level Pricing"
            value={filters.levelPricing}
            onChange={handleFilterChange('levelPricing')}
            options={filteredLevelPricingFilterOptions}
            placeholder="All pricing plans"
            isClearable
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={handleDateChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mode</label>
            <input
              type="text"
              value={filters.mode}
              onChange={handleTextFilterChange('mode')}
              placeholder="e.g. Cash"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleTextFilterChange('search')}
              placeholder="Reference, mode, or student name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  School Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reference
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
              {paymentsLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading student payments…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-500">
                    No student payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const amountValue = Number(payment.amount);
                  const paymentValue = Number(payment.payment);
                  const balance = Number.isFinite(amountValue) && Number.isFinite(paymentValue)
                    ? amountValue - paymentValue
                    : null;
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">#{payment.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{getStudentName(payment)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.schoolYear?.title || `Year #${payment.school_year_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.level?.title || `Level #${payment.level_id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(payment.payment)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {balance === null ? '—' : formatCurrency(balance)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.mode || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.reference || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[payment.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[payment.status] ?? `Status ${payment.status}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(payment)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(payment)}
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
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
          currentPage={paymentsMeta.page}
          totalPages={paymentsMeta.totalPages}
          totalItems={paymentsMeta.total}
          itemsPerPage={paymentsMeta.limit}
          hasNext={paymentsMeta.hasNext}
          hasPrevious={paymentsMeta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={paymentsLoading}
        />
      </div>

      <StudentPaymentModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialData={editingPayment ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createPaymentMut.isPending || updatePaymentMut.isPending}
        studentOptions={studentOptions}
        schoolYearOptions={schoolYearOptions}
        levelOptions={levelOptions}
        levelPricingOptions={levelPricingOptions}
        // companyOptions removed - company is auto-set from authenticated user
        serverError={modalError}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePaymentMut.isPending}
        title="Delete Student Payment"
        entityName={deleteTarget ? getStudentName(deleteTarget) : undefined}
      />
    </div>
  );
};

export default StudentPaymentsSection;


