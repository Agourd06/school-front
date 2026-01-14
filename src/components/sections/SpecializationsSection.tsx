import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSpecializations,
  useDeleteSpecialization,
} from '../../hooks/useSpecializations';
import { usePrograms } from '../../hooks/usePrograms';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import SpecializationModal from '../modals/SpecializationModal';
import DeleteModal from '../modals/DeleteModal';
import DescriptionModal from '../modals/DescriptionModal';
import { EditButton, DeleteButton, Button, Input, PdfActions, PageHeader } from '../ui';
import { Info, Target } from 'lucide-react';
import type { Specialization } from '../../api/specialization';
import type { Program } from '../../api/program';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
import { useProgram } from '../../context/ProgramContext';
import { useSpecialization as useSpecializationContext } from '../../context/SpecializationContext';

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

const stripHtml = (input?: string | null): string => {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '');
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

const SpecializationsSection: React.FC = () => {
  const { t } = useTranslation();
  const { selectedProgramId, navigateBackToPrograms, clearSelectedProgram } = useProgram();
  const { navigateToLevels } = useSpecializationContext();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    program: '',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Specialization | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      // Use manual filter if set, otherwise use context filter, otherwise show all
      program_id: filters.program ? Number(filters.program) : (selectedProgramId || undefined),
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination, selectedProgramId]
  );

  const {
    data: specializationsResp,
    isLoading,
    error,
    refetch: refetchSpecializations,
  } = useSpecializations(params);

  const specializations = specializationsResp?.data ?? [];
  const meta = specializationsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteSpecializationMut = useDeleteSpecialization();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 });

  const programOptions = useMemo<SearchSelectOption[]>(
    () =>
      (programsResp?.data || []).map((program: Program) => ({
        value: program.id,
        label: program.title || `Program #${program.id}`,
      })),
    [programsResp]
  );

  // Get the selected program name
  const selectedProgram = useMemo(() => {
    if (!selectedProgramId || !programsResp?.data) return null;
    return programsResp.data.find((p: Program) => p.id === selectedProgramId);
  }, [selectedProgramId, programsResp]);

  // Sync filter with context when context changes
  useEffect(() => {
    if (selectedProgramId && !filters.program) {
      setFilters((prev) => ({ ...prev, program: String(selectedProgramId) }));
    } else if (!selectedProgramId && filters.program) {
      // If context is cleared, clear the filter too
      setFilters((prev) => ({ ...prev, program: '' }));
    }
  }, [selectedProgramId, filters.program]);

  const openCreateModal = () => {
    setEditingSpecialization(null);
    setModalOpen(true);
  };

  const openEditModal = (specialization: Specialization) => {
    setEditingSpecialization(specialization);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSpecialization(null);
  };

  const openDescriptionModal = (specialization: Specialization) => {
    setDescriptionModal({
      title: specialization.title || `Specialization #${specialization.id}`,
      description: specialization.description ?? '',
    });
  };

  const closeDescriptionModal = () => {
    setDescriptionModal(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleModalClose = () => {
    closeModal();
    refetchSpecializations();
  };

  const requestDelete = (specialization: Specialization) => {
    setDeleteTarget(specialization);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteSpecializationMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.specializationDeletedSuccessfully') });
      refetchSpecializations();
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

  const handleRowClick = (specialization: Specialization, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('td:last-child')) {
      return;
    }
    navigateToLevels(specialization.id);
  };

  return (
    <div className="space-y-6">
        <PageHeader
          titleKey="pages.specializationsTitle"
          descriptionKey="pages.specializationsDescription"
          icon={<Target className="w-5 h-5" />}
          actions={
            <>
              {selectedProgramId && navigateBackToPrograms && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    clearSelectedProgram();
                    setFilters((prev) => ({ ...prev, program: '' }));
                    navigateBackToPrograms();
                  }}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('common.previous')}
                </Button>
              )}
              {selectedProgramId && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('sections.addSpecialization')}
                </Button>
              )}
            </>
          }
        />
        {selectedProgram && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Program:</span> {selectedProgram.title}
            </p>
          </div>
        )}
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
   

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label={t('sections.program')}
            value={filters.program}
            onChange={handleFilterChange('program')}
            options={programOptions}
            placeholder={t('sections.allPrograms')}
            isClearable
          />
          <div className="md:col-span-2">
            <Input
              label={t('common.search')}
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchBySpecializationTitle')}
              className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.program')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.status')}
                </th>
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
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.loadingSpecializations')}
                  </td>
                </tr>
              ) : specializations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('sections.noSpecializationsFound')}
                  </td>
                </tr>
              ) : (
                specializations.map((spec) => {
                  const statusValue = typeof spec.status === 'number' ? spec.status : 0;
                  const programTitle = spec.program?.title || `Program #${spec.program_id}`;
                  const hasDescription = !!stripHtml(spec.description ?? '');
                  return (
                    <tr
                      key={spec.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleRowClick(spec, e)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="text-gray-600 font-normal">{programTitle}</span>
                        
                      </td>
                      <td className="px-4 py-3 text-sm font-normal text-gray-600">{spec.title}</td>
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
                        <PdfActions pdfPath={spec.pdf_file} fileName={spec.title} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToLevels(spec.id);
                            }}
                            className="inline-flex items-center rounded-md border border-primary-light px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                            title={t('sections.viewLevels')}
                          >
                          
                            {t('sections.levels')}
                          </button>
                          {hasDescription && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDescriptionModal(spec);
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
                              openEditModal(spec);
                            }}
                          />
                          <DeleteButton
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(spec);
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

      <SpecializationModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        specialization={
          editingSpecialization
            ? ({
                ...editingSpecialization,
                program: editingSpecialization.program ?? undefined,
                description: editingSpecialization.description ?? undefined,
                status: editingSpecialization.status ?? 1,
              } as import('../forms/SpecializationForm').Specialization)
            : undefined
        }
        initialProgramId={selectedProgramId ?? undefined}
      />

      {descriptionModal && (
        <DescriptionModal
          isOpen
          onClose={closeDescriptionModal}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="specialization"
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('sections.deleteSpecialization')}
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteSpecializationMut.isPending}
      />
    </div>
  );
};

export default SpecializationsSection;
