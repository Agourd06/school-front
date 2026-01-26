import React from 'react';
import { useTranslation } from 'react-i18next';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import { Button, PageHeader } from './ui';

type ListState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: Record<string, unknown> & { search?: string; status?: number | null | undefined };
};

interface StatusOption {
  value: number;
  label: string;
}

interface DataTableGenericProps<T> {
  title: string;
  titleKey?: string;
  descriptionKey?: string;
  icon?: React.ReactNode;
  state: ListState<T>;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (query: string) => void;
  onFilterChange?: (status: number | null) => void;
  addButtonText: string;
  searchPlaceholder: string;
  filterOptions?: StatusOption[];
  renderRow: (item: T, onEdit: (item: T) => void, onDelete: (id: number) => void, index: number) => React.ReactNode;
}

function DataTableGeneric<T extends { id: number }>({
  title,
  titleKey,
  descriptionKey,
  icon,
  state,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  addButtonText,
  searchPlaceholder,
  filterOptions,
  renderRow,
}: DataTableGenericProps<T>) {
  const { t } = useTranslation();
  const { data, loading, error, pagination, filters } = state as ListState<T>;

  const statusFilterOptions = filterOptions ?? [
    { value: 0, label: 'Disabled ' },
    { value: 1, label: 'Active ' },
    { value: 2, label: 'Pending ' },
    { value: -1, label: 'Archived ' },
    { value: -2, label: 'Deleted ' },
  ];

  return (
    <div className="space-y-6">
      {titleKey && descriptionKey ? (
        <PageHeader
          titleKey={titleKey}
          descriptionKey={descriptionKey}
          icon={icon}
          actions={
            <Button
              type="button"
              variant="primary"
              onClick={onAdd}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {addButtonText}
            </Button>
          }
        />
      ) : (
        <div className="border-b border-tertiary/20 bg-white pb-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={onAdd}
                className="inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {addButtonText}
              </Button>
            </div>
          </div>
        </div>
      )}
    <div className="bg-white rounded-xl border border-tertiary/20 shadow-sm overflow-hidden">

      <div className="px-4 py-3 bg-surface border-t border-tertiary/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar onSearch={onSearch} placeholder={searchPlaceholder} isLoading={loading} />
          </div>
          {onFilterChange && (
            <div className="w-full sm:w-48">
              <FilterDropdown
                options={statusFilterOptions}
                value={(filters as { status?: number | null }).status ?? null}
                onChange={(val) => onFilterChange?.(val === null ? null : Number(val))}
                placeholder={t('sections.filterByStatus')}
                isLoading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-danger-light border-t border-danger-light">
          <div className="text-sm text-danger">Error: {error}</div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
            <span className="text-body">{t('common.loading')}</span>
          </div>
        </div>
      ) : (
        <>
          {Array.isArray(data) && data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-tertiary/10">
                <thead className="bg-surface/50 border-b border-tertiary/20">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                      {t('common.name') || 'Name'}
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                      {t('forms.email') || 'Email'}
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-heading uppercase tracking-wider hidden md:table-cell">
                      {t('sections.roles') || 'Roles'}
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                      {t('forms.statusLabel') || 'Status'}
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-heading uppercase tracking-wider">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-tertiary/10">
                  {(data as T[]).map((item, index) => renderRow(item, onEdit, onDelete, index))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="max-w-sm mx-auto">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-heading">
                  {(filters as { search?: string }).search
                    ? t('sections.noUsersFound') || 'No users found'
                    : t('sections.noUsersYet') || 'No users yet'}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {(filters as { search?: string }).search
                    ? t('sections.noUsersFoundMessage') || 'Try adjusting your search to find what you\'re looking for.'
                    : t('sections.noUsersYetMessage') || 'Get started by creating a new user.'}
                </p>
                {!(filters as { search?: string }).search && (
                  <div className="mt-6">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onAdd}
                      className="inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {addButtonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {pagination.total > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
    </div>
  );
}

export default DataTableGeneric;

