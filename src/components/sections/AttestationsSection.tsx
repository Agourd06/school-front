import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAttestations,
  useDeleteAttestation,
} from '../../hooks/useAttestations';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import AttestationModal from '../modals/AttestationModal';
import DeleteModal from '../modals/DeleteModal';
import BaseModal from '../modals/BaseModal';
import { EditButton, DeleteButton, Button, PageHeader } from '../ui';
import { FileText } from 'lucide-react';
import type { Attestation } from '../../api/attestation';
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
  ...STATUS_OPTIONS.filter((opt) => opt.value !== -2).map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const statusStyles: Record<number, string> = {
  2: 'bg-warning-badge',
  1: 'bg-success-badge',
  0: 'bg-muted-badge',
  [-1]: 'bg-accent-badge',
  [-2]: 'bg-danger-badge',
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

const AttestationsSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttestation, setEditingAttestation] = useState<Attestation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attestation | null>(null);
  const [detailsAttestation, setDetailsAttestation] = useState<Attestation | null>(null);
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
    data: attestationsResp,
    isLoading,
    error,
    refetch: refetchAttestations,
  } = useAttestations(params);

  const attestations = attestationsResp?.data ?? [];
  const meta = attestationsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteAttestationMut = useDeleteAttestation();

  const openCreateModal = () => {
    setEditingAttestation(null);
    setModalOpen(true);
  };

  const openEditModal = (attestation: Attestation) => {
    setEditingAttestation(attestation);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAttestation(null);
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
    refetchAttestations();
  };

  const requestDelete = (attestation: Attestation) => {
    setDeleteTarget(attestation);
    setAlert(null);
  };

  const openDetailsModal = (attestation: Attestation) => {
    setDetailsAttestation(attestation);
  };

  const closeDetailsModal = () => {
    setDetailsAttestation(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteAttestationMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: 'Attestation deleted successfully.' });
      refetchAttestations();
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
          titleKey="pages.attestationsTitle"
          descriptionKey="pages.attestationsDescription"
          icon={<FileText className="w-5 h-5" />}
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
              {t('sections.addAttestation')}
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
      

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-body">
          <SearchSelect
            label={t('common.status')}
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-heading">{t('common.search')}</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('sections.searchByAttestationTitle')}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>
        </div>
      

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('common.name')}
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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading attestations…
                  </td>
                </tr>
              ) : attestations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    No attestations found.
                  </td>
                </tr>
              ) : (
                attestations.map((att) => {
                  const statusValue = typeof att.statut === 'number' ? att.statut : 0;
                  return (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{att.title}</td>
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
                            onClick={() => openDetailsModal(att)}
                            className="inline-flex items-center rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            Remarks
                          </button>
                          <EditButton onClick={() => openEditModal(att)} />
                          <DeleteButton onClick={() => requestDelete(att)} />
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

      <AttestationModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        attestation={editingAttestation ?? undefined}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Attestation"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAttestationMut.isPending}
      />

      {detailsAttestation && (
        <BaseModal
          isOpen
          onClose={closeDetailsModal}
          title={`Attestation Details: ${detailsAttestation.title}`}
          className="sm:max-w-4xl"
          contentClassName="space-y-4"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('common.name')}</h3>
              <p className="text-gray-700">{detailsAttestation.title}</p>
            </div>
            {detailsAttestation.company && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('sidebar.companies')}</h3>
                <p className="text-gray-700">{detailsAttestation.company.name}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('common.status')}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusStyles[typeof detailsAttestation.statut === 'number' ? detailsAttestation.statut : 0] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {STATUS_VALUE_LABEL[typeof detailsAttestation.statut === 'number' ? detailsAttestation.statut : 0] ?? 'Unknown'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <div className="rt-content border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: detailsAttestation.description || '<p class="text-gray-500 italic">No description available</p>',
                  }}
                />
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default AttestationsSection;

