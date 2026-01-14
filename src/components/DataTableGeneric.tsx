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
        <div className="border-b border-gray-200 bg-white pb-6 mb-6">
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden transition-shadow duration-200 hover:shadow-lg">

      <div className="px-4 py-3 bg-surface border-t border-border">
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
          <ul className="divide-y divide-border">
            {Array.isArray(data) && data.length > 0 ? (
              (data as T[]).map((item, index) => renderRow(item, onEdit, onDelete, index))
            ) : (
              <li className="px-4 py-8 sm:px-6">
                <div className="text-center text-muted">
                  {(filters as { search?: string }).search ? (
                    <>{t('forms.noItemsFoundMatching', { item: title.toLowerCase(), search: (filters as { search?: string }).search })}</>
                  ) : (
                    t('forms.noItemsFound', { item: title.toLowerCase() })
                  )}
                </div>
              </li>
            )}
          </ul>

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

