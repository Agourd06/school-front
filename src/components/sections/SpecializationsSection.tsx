import React, { useEffect, useMemo, useState } from 'react';
import {
  useSpecializations,
  useCreateSpecialization,
  useUpdateSpecialization,
  useDeleteSpecialization,
} from '../../hooks/useSpecializations';
import { usePrograms } from '../../hooks/usePrograms';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import SpecializationModal from '../modals/SpecializationModal';
import DeleteModal from '../modals/DeleteModal';
import DescriptionModal from '../modals/DescriptionModal';
import type { Specialization } from '../../api/specialization';
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

const stripHtml = (input?: string | null): string => {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '');
};

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const SpecializationsSection: React.FC = () => {
  const { selectedProgramId, navigateBackToPrograms, clearSelectedProgram } = useProgram();
  const { setSelectedSpecializationId, navigateToLevels } = useSpecializationContext();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    program: '',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Specialization | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);
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

  const createSpecializationMut = useCreateSpecialization();
  const updateSpecializationMut = useUpdateSpecialization();
  const deleteSpecializationMut = useDeleteSpecialization();

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);

  const programOptions = useMemo<SearchSelectOption[]>(
    () =>
      (programsResp?.data || []).map((program: any) => ({
        value: program.id,
        label: program.title || `Program #${program.id}`,
      })),
    [programsResp]
  );

  // Sync filter with context when context changes
  useEffect(() => {
    if (selectedProgramId && !filters.program) {
      setFilters((prev) => ({ ...prev, program: String(selectedProgramId) }));
    } else if (!selectedProgramId && filters.program) {
      // If context is cleared, clear the filter too
      setFilters((prev) => ({ ...prev, program: '' }));
    }
  }, [selectedProgramId]);

  const openCreateModal = () => {
    setEditingSpecialization(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (specialization: Specialization) => {
    setEditingSpecialization(specialization);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSpecialization(null);
    setModalError(null);
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
      setAlert({ type: 'success', message: 'Specialization deleted successfully.' });
      refetchSpecializations();
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

  const handleRowClick = (specialization: Specialization, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('td:last-child')) {
      return;
    }
    setSelectedSpecializationId(specialization.id);
    if (navigateToLevels) {
      navigateToLevels();
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Specializations</h1>
            <p className="text-sm text-gray-500">Manage specializations and their associated programs.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedProgramId && navigateBackToPrograms && (
              <button
                type="button"
                onClick={() => {
                  clearSelectedProgram();
                  setFilters((prev) => ({ ...prev, program: '' }));
                  navigateBackToPrograms();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Specialization
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
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
   

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <SearchSelect
            label="Program"
            value={filters.program}
            onChange={handleFilterChange('program')}
            options={programOptions}
            placeholder="All programs"
            isClearable
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by specialization title..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Program
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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading specializations…
                  </td>
                </tr>
              ) : specializations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    No specializations found.
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{spec.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{programTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[statusValue] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_VALUE_LABEL[statusValue] ?? `Status ${statusValue}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSpecializationId(spec.id);
                              if (navigateToLevels) {
                                navigateToLevels();
                              }
                            }}
                            className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            title="View levels"
                          >
                          
                            Levels
                          </button>
                          {hasDescription && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDescriptionModal(spec);
                              }}
                              className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                              Details
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(spec);
                            }}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(spec);
                            }}
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
        specialization={editingSpecialization ?? undefined}
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
        title="Delete Specialization"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteSpecializationMut.isPending}
      />
    </div>
  );
};

export default SpecializationsSection;
