import React, { useEffect, useMemo, useState } from 'react';
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
} from '../../hooks/useModules';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import ModuleModal from '../modals/ModuleModal';
import DeleteModal from '../modals/DeleteModal';
import DescriptionModal from '../modals/DescriptionModal';
import CourseAssignmentModal from '../modals/CourseAssignmentModal';
import type { Module } from '../../api/module';
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

const stripHtml = (input?: string | null): string => {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '');
};

const getDescriptionPreview = (input?: string | null): string => {
  const text = stripHtml(input);
  if (!text) return '';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const ModulesSection: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);
  const [assignmentModal, setAssignmentModal] = useState<{ moduleId: number; moduleTitle: string } | null>(null);
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
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: modulesResp,
    isLoading,
    error,
    refetch: refetchModules,
  } = useModules(params);

  const modules = modulesResp?.data ?? [];
  const meta = modulesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteModuleMut = useDeleteModule();

  const openCreateModal = () => {
    setEditingModule(null);
    setModalOpen(true);
  };

  const openEditModal = (module: Module) => {
    setEditingModule(module);
    setModalOpen(true);
  };

  const openDescriptionModal = (module: Module) => {
    setDescriptionModal({
      title: module.title || `Module #${module.id}`,
      description: module.description ?? '',
    });
  };

  const openAssignmentModal = (module: Module) => {
    setAssignmentModal({
      moduleId: module.id,
      moduleTitle: module.title || `Module #${module.id}`,
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingModule(null);
  };

  const closeDescriptionModal = () => {
    setDescriptionModal(null);
  };

  const closeAssignmentModal = () => {
    setAssignmentModal(null);
    refetchModules();
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
    refetchModules();
  };

  const requestDelete = (module: Module) => {
    setDeleteTarget(module);
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteModuleMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Module deleted successfully.' });
      refetchModules();
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
            <h1 className="text-xl font-semibold text-gray-900">Modules</h1>
            <p className="text-sm text-gray-500">Manage modules and their associated courses.</p>
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
              Add Module
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
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by module title..."
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Volume
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Coefficient
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
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading modules…
                  </td>
                </tr>
              ) : modules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No modules found.
                  </td>
                </tr>
              ) : (
                modules.map((module) => {
                  const statusValue = typeof module.status === 'number' ? module.status : 0;
                  const hasDescription = !!stripHtml(module.description ?? '');
                  return (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{module.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {module.volume !== null && module.volume !== undefined ? (
                          <span className="font-semibold text-gray-900">{module.volume}</span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {module.coefficient !== null && module.coefficient !== undefined ? (
                          <span className="font-semibold text-gray-900">{module.coefficient}</span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
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
                          {hasDescription && (
                            <button
                              type="button"
                              onClick={() => openDescriptionModal(module)}
                              className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                              Details
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openAssignmentModal(module)}
                            className="inline-flex items-center rounded-md border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50"
                          >
                            Manage Courses
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(module)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(module)}
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

      <ModuleModal isOpen={modalOpen} onClose={handleModalClose} module={editingModule ?? undefined} />

      {descriptionModal && (
        <DescriptionModal
          isOpen
          onClose={closeDescriptionModal}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="module"
        />
      )}

      {assignmentModal && (
        <CourseAssignmentModal
          isOpen
          onClose={closeAssignmentModal}
          moduleId={assignmentModal.moduleId}
          moduleTitle={assignmentModal.moduleTitle}
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Module"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteModuleMut.isPending}
      />
    </div>
  );
};

export default ModulesSection;
