import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { EditButton, DeleteButton, Button, PageHeader } from '../ui';
import { CreditCard } from 'lucide-react';
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

const getStatusFilterOptions = (t: (key: string) => string): SearchSelectOption[] => [
  { value: 'all', label: t('sections.allStatuses') },
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-200 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
};

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
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

const getStudentName = (payment: StudentPayment, t: (key: string) => string) => {
  const first = payment.student?.first_name ?? '';
  const last = payment.student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || payment.student?.email || `${t('forms.studentNumber')}${payment.student_id}`;
};

const StudentPaymentsSection: React.FC = () => {
  const { t } = useTranslation();
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
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

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

  const { data: studentsResp } = useStudents({ page: 1, limit: 100 });
  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 });
  const { data: levelsResp } = useLevels({ page: 1, limit: 100 });
  const { data: levelPricingResp } = useLevelPricings({ page: 1, limit: 100 });

  const studentOptions = useMemo<SearchSelectOption[]>(
    () =>
      (studentsResp?.data || []).map((student) => ({
        value: student.id,
        label:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() ||
          student.email ||
          `${t('forms.studentNumber')}${student.id}`,
      })),
    [studentsResp, t]
  );

  const schoolYearOptions = useMemo<SearchSelectOption[]>(
    () =>
      (schoolYearsResp?.data || []).map((year) => ({
        value: year.id,
        label: year.title || `${t('forms.schoolYearNumber')}${year.id}`,
      })),
    [schoolYearsResp, t]
  );

  const levelOptions = useMemo<SearchSelectOption[]>(
    () =>
      (levelsResp?.data || []).map((level) => ({
        value: level.id,
        label: level.title || `${t('forms.levelNumber')}${level.id}`,
      })),
    [levelsResp, t]
  );

  // const companyOptions removed - company is auto-set from authenticated user

  const levelPricingOptions = useMemo<SearchSelectOption[]>(
    () =>
      (levelPricingResp?.data || []).map((pricing) => ({
        value: pricing.id,
        label: pricing.title || `${t('forms.pricingNumber')}${pricing.id}`,
        data: { level_id: pricing.level_id },
      })),
    [levelPricingResp, t]
  );

  const filteredLevelPricingFilterOptions = useMemo(() => {
    if (!filters.level) return levelPricingOptions;
    return levelPricingOptions.filter((option) => {
      const data = option.data as { level_id?: number; levelId?: number } | undefined;
      const levelId = data?.level_id ?? data?.levelId;
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
        setAlert({ type: 'success', message: t('messages.studentPaymentUpdatedSuccessfully') });
      } else {
        await createPaymentMut.mutateAsync(payload);
        setAlert({ type: 'success', message: t('messages.studentPaymentCreatedSuccessfully') });
      }
      closeModal();
      refetchPayments();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
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
        setAlert({ type: 'success', message: t('messages.studentPaymentDeletedSuccessfully') });
      refetchPayments();
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

  return (
    <div className="space-y-6">
        <PageHeader
          titleKey="pages.studentPaymentsTitle"
          descriptionKey="pages.studentPaymentsDescription"
          icon={<CreditCard className="w-5 h-5" />}
          actions={
            <Button
              type="button"
              variant="primary"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('sections.addStudentPayment')}
            </Button>
          }
        />
        {alert && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              alert.type === 'success'
                ? 'border-success-light bg-success-light text-success-dark'
                : 'border-danger-light bg-danger-light text-danger-dark'
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleTextFilterChange('search')}
              placeholder={t('forms.searchByReferenceModeOrStudentName')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label={t('common.student')}
            value={filters.student}
            onChange={handleFilterChange('student')}
            options={studentOptions}
            placeholder={t('sections.allStudents')}
            isClearable
          />
          <SearchSelect
            label={t('sidebar.schoolYears')}
            value={filters.schoolYear}
            onChange={handleFilterChange('schoolYear')}
            options={schoolYearOptions}
            placeholder={t('sections.allSchoolYears')}
            isClearable
          />
          <SearchSelect
            label={t('sidebar.levels')}
            value={filters.level}
            onChange={(value) => {
              handleFilterChange('level')(value);
              setFilters((prev) => ({ ...prev, levelPricing: '' }));
            }}
            options={levelOptions}
            placeholder={t('sections.allLevels')}
            isClearable
          />
          <SearchSelect
            label={t('forms.levelPricing')}
            value={filters.levelPricing}
            onChange={handleFilterChange('levelPricing')}
            options={filteredLevelPricingFilterOptions}
            placeholder={t('forms.allPricingPlans')}
            isClearable
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.date')}</label>
            <input
              type="date"
              value={filters.date}
              onChange={handleDateChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('forms.mode')}</label>
            <input
              type="text"
              value={filters.mode}
              onChange={handleTextFilterChange('mode')}
              placeholder={t('forms.exampleCash')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.student')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sidebar.schoolYears')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sidebar.levels')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('forms.amount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('forms.payment')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('forms.balance')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('forms.mode')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('forms.reference')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paymentsLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.loadingStudentPayments')}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.noStudentPaymentRecordsFound')}
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
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{getStudentName(payment, t)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.schoolYear?.title || `${t('forms.yearNumber')}${payment.school_year_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.level?.title || `${t('forms.levelNumber')}${payment.level_id}`}</td>
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
                          {STATUS_VALUE_LABEL[payment.status] ?? `${t('common.status')} ${payment.status}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton onClick={() => openEditModal(payment)} />
                          <DeleteButton onClick={() => setDeleteTarget(payment)} />
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
        title={t('forms.deleteStudentPayment')}
        entityName={deleteTarget ? getStudentName(deleteTarget, t) : undefined}
      />
    </div>
  );
};

export default StudentPaymentsSection;


