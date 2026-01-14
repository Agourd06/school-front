import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import { ProgramModal, DeleteModal, DescriptionModal } from '../modals';
import { EditButton, DeleteButton, Button, PdfActions, PageHeader } from '../ui';
import { usePrograms, useDeleteProgram } from '../../hooks/usePrograms';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
import { useProgram } from '../../context/ProgramContext';
import { Info, GraduationCap } from 'lucide-react';
import type { Program } from '../../api/program';

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
  2: 'bg-warning-badge',
  1: 'bg-success-badge',
  0: 'bg-muted-badge',
  [-1]: 'bg-accent-badge',
  [-2]: 'bg-danger-badge',
};

const stripHtml = (input?: string) => {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '');
};

const ProgramsSection: React.FC = () => {
  const { t } = useTranslation();
  const { setSelectedProgramId, navigateToSpecializations } = useProgram();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name?: string } | null>(null);
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search ? filters.search.trim() : undefined,
      status:
        filters.status === 'all' ? undefined : (filters.status !== '' ? Number(filters.status) : undefined),
    }),
    [filters, pagination]
  );

  const {
    data: programsResp,
    isLoading,
    error,
    refetch,
  } = usePrograms(params);

  const programs = programsResp?.data ?? [];
  const meta = programsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteProgramMut = useDeleteProgram();

  const handleFilterChange = (value: string | number | '') => {
    setFilters((prev) => ({
      ...prev,
      status: value === undefined || value === null ? 'all' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateModal = () => {
    setEditingProgram(null);
    setProgramModalOpen(true);
  };

  const openEditModal = (program: Program) => {
    setEditingProgram(program);
    setProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setProgramModalOpen(false);
    setEditingProgram(null);
  };

  const openDescriptionModal = (program: Program) => setDescriptionModal({ title: program.title, description: program.description || '' });
  const closeDescriptionModal = () => setDescriptionModal(null);

  const requestDelete = (program: Program) => {
    setDeleteTarget({ id: program.id, name: program.title });
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteProgramMut.mutateAsync(deleteTarget.id);
      setAlert({ type: 'success', message: t('sections.programDeletedSuccessfully') });
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data) ? error.response.data.join(', ') : error?.message) ||
        t('sections.failedToDeleteProgram');
      setAlert({ type: 'error', message: Array.isArray(message) ? message.join(', ') : message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const handleRowClick = (program: Program, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('td:last-child')) {
      return;
    }
    navigateToSpecializations(program.id);
  };

  return (
    <div className="space-y-6">
        <PageHeader
          titleKey="pages.programsTitle"
          descriptionKey="pages.programsDescription"
          icon={<GraduationCap className="w-5 h-5" />}
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
              {t('sections.addProgram')}
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
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
     

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange}
            options={statusFilterOptions}
            isClearable={false}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchByProgramTitle')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sections.title')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.pdfDocument')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              ) : (
                programs.map((program) => {
                  const statusValue = typeof program.status === 'number' ? program.status : 0;
                  const hasDescription = !!stripHtml(program.description ?? '');
                  return (
                    <tr
                      key={program.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleRowClick(program, e)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{program.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[statusValue] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[statusValue] ?? `Status ${statusValue}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <PdfActions pdfPath={program.pdf_file} fileName={program.title} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgramId(program.id);
                              if (navigateToSpecializations) {
                                navigateToSpecializations();
                              }
                            }}
                            className="inline-flex items-center rounded-md border border-primary-light px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                            title={t('sections.viewSpecializations')}
                          >
                            
                            {t('sections.specializations')}
                          </button>
                          {hasDescription && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDescriptionModal(program);
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-green-200 p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                              title={t('sections.viewDetails')}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          )}
                          <EditButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(program);
                            }}
                          />
                          <DeleteButton
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(program);
                            }}
                          />
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
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
      </div>

      <ProgramModal
        isOpen={programModalOpen}
        onClose={closeProgramModal}
        program={
          editingProgram
            ? ({
                ...editingProgram,
                description: editingProgram.description ?? undefined,
                status: editingProgram.status ?? 1,
              } as import('../forms/ProgramForm').Program)
            : undefined
        }
      />

      {descriptionModal && (
        <DescriptionModal
          isOpen
          onClose={closeDescriptionModal}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="program"
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deleteProgram')}
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteProgramMut.isPending}
      />
    </div>
  );
};

export default ProgramsSection;