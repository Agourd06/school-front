import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useCompanies, useUpdateCompany } from '../../hooks/useCompanies';
import { CompanyModal, DeleteModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';
import { EditButton, DeleteButton } from '../ui';

const CompaniesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'company' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: FilterParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status,
  };

  const { data: response, isLoading, error } = useCompanies(params);

  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as any)?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

  const updater = useUpdateCompany();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, status: -2 });
  };

  const requestDelete = (id: number) => {
    const company = state.data.find((item: any) => item.id === id);
    if (!company) return;
    setDeleteTarget({ id, name: company.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await performDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const open = (data?: any) => setModal({ type: 'company', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return {
        ...prev,
        filters: { ...prev.filters, search: q },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  return (
    <>
      <DataTableGeneric
        title="Companies"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Company"
        searchPlaceholder="Search by company name..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(company: any, onEdit, onDelete, index) => (
          <li key={company?.id ?? `company-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{company.name}</p>
                <p className="text-sm text-gray-500">Email: {company.email}</p>
                <p className="text-sm text-gray-500">Phone: {company.phone || '—'}</p>
                <p className="text-sm text-gray-500">Website: {company.website || '—'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={company.status} /></p>
              </div>
              <div className="flex space-x-2">
                <EditButton onClick={() => onEdit(company)} />
                <DeleteButton onClick={() => onDelete(company.id)} />
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'company' && (
        <CompanyModal isOpen onClose={close} company={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Company"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default CompaniesSection;

