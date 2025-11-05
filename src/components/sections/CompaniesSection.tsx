import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useCompanies, useDeleteCompany } from '../../hooks/useCompanies';
import { CompanyModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const CompaniesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'company' | null; data?: any }>({ type: null });

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

  const del = useDeleteCompany();
  const handleDelete = async (id: number) => {
    if (window.confirm('Delete company?')) await del.mutateAsync(id);
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
        onDelete={handleDelete}
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
                <button onClick={() => onEdit(company)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(company.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'company' && (
        <CompanyModal isOpen onClose={close} company={modal.data} />
      )}
    </>
  );
};

export default CompaniesSection;

